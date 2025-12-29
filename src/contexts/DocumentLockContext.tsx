import React, { createContext, useContext, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase, DbDocumentLock } from '../lib/supabase';

interface LockInfo {
  lockedBy: string;
  lockedByName: string;
  lockedAt: string;
  queuePosition: number;
  isLocked: boolean;
  isOwnLock: boolean;
}

interface DocumentLockContextType {
  acquireLock: (documentId: string, documentType: string) => Promise<LockInfo>;
  releaseLock: (documentId: string, documentType: string) => Promise<void>;
  refreshLock: (documentId: string, documentType: string) => Promise<void>;
  getLockInfo: (documentId: string, documentType: string) => Promise<LockInfo | null>;
  checkLockStatus: (documentId: string, documentType: string) => Promise<LockInfo>;
}

const DocumentLockContext = createContext<DocumentLockContextType | undefined>(undefined);

// Lock expires after 2 minutes without heartbeat
const LOCK_EXPIRY_MS = 2 * 60 * 1000;
// Heartbeat interval - refresh lock every 30 seconds
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export const DocumentLockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const activeLocksRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up locks when component unmounts or user logs out
  useEffect(() => {
    const locksRef = activeLocksRef.current;
    return () => {
      // Clear all heartbeat intervals
      locksRef.forEach((interval) => {
        clearInterval(interval);
      });
      locksRef.clear();
    };
  }, []);

  // Release all locks when user changes (logout)
  useEffect(() => {
    if (!user) {
      // Clear all heartbeat intervals
      activeLocksRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      activeLocksRef.current.clear();
    }
  }, [user]);

  const getLockKey = (documentId: string, documentType: string) => `${documentType}:${documentId}`;

  // Clean up expired locks
  const cleanupExpiredLocks = useCallback(async (documentId: string, documentType: string) => {
    const expiryTime = new Date(Date.now() - LOCK_EXPIRY_MS).toISOString();

    // Delete locks that haven't been refreshed
    await supabase
      .from('document_locks')
      .delete()
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .lt('last_heartbeat', expiryTime);
  }, []);

  // Get current lock info for a document
  const getLockInfo = useCallback(async (documentId: string, documentType: string): Promise<LockInfo | null> => {
    if (!user) return null;

    // Clean up expired locks first
    await cleanupExpiredLocks(documentId, documentType);

    const { data, error } = await supabase
      .from('document_locks')
      .select('*')
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .order('queue_position', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    const firstLock = data[0] as DbDocumentLock;
    const userLock = data.find((lock: DbDocumentLock) => lock.locked_by === user.id);

    return {
      lockedBy: firstLock.locked_by,
      lockedByName: firstLock.locked_by_name,
      lockedAt: firstLock.locked_at,
      queuePosition: userLock ? userLock.queue_position : data.length + 1,
      isLocked: true,
      isOwnLock: firstLock.locked_by === user.id
    };
  }, [user, cleanupExpiredLocks]);

  // Check lock status - returns info about who has the lock
  const checkLockStatus = useCallback(async (documentId: string, documentType: string): Promise<LockInfo> => {
    const lockInfo = await getLockInfo(documentId, documentType);

    if (!lockInfo) {
      return {
        lockedBy: '',
        lockedByName: '',
        lockedAt: '',
        queuePosition: 0,
        isLocked: false,
        isOwnLock: false
      };
    }

    return lockInfo;
  }, [getLockInfo]);

  // Refresh the lock (heartbeat) - defined before acquireLock since it's used there
  const refreshLock = useCallback(async (documentId: string, documentType: string) => {
    if (!user) return;

    const now = new Date().toISOString();

    // First, clean up expired locks
    await cleanupExpiredLocks(documentId, documentType);

    // Update heartbeat
    await supabase
      .from('document_locks')
      .update({ last_heartbeat: now })
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .eq('locked_by', user.id);

    // Check if we need to promote queue positions
    const { data: locks } = await supabase
      .from('document_locks')
      .select('*')
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .order('queue_position', { ascending: true });

    if (locks && locks.length > 0) {
      // Reassign queue positions to be sequential (1, 2, 3, ...)
      for (let i = 0; i < locks.length; i++) {
        if (locks[i].queue_position !== i + 1) {
          await supabase
            .from('document_locks')
            .update({ queue_position: i + 1 })
            .eq('id', locks[i].id);
        }
      }
    }
  }, [user, cleanupExpiredLocks]);

  // Acquire a lock on a document
  const acquireLock = useCallback(async (documentId: string, documentType: string): Promise<LockInfo> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Clean up expired locks first
    await cleanupExpiredLocks(documentId, documentType);

    // Check current locks
    const { data: existingLocks, error: fetchError } = await supabase
      .from('document_locks')
      .select('*')
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .order('queue_position', { ascending: true });

    if (fetchError) {
      console.error('Error fetching locks:', fetchError);
      throw fetchError;
    }

    const locks = (existingLocks || []) as DbDocumentLock[];
    const userLock = locks.find(lock => lock.locked_by === user.id);

    // If user already has a lock, just refresh it
    if (userLock) {
      await refreshLock(documentId, documentType);
      return {
        lockedBy: locks[0]?.locked_by || user.id,
        lockedByName: locks[0]?.locked_by_name || `${user.firstName} ${user.lastName}`,
        lockedAt: locks[0]?.locked_at || new Date().toISOString(),
        queuePosition: userLock.queue_position,
        isLocked: locks.length > 0,
        isOwnLock: locks[0]?.locked_by === user.id
      };
    }

    // Calculate queue position
    const queuePosition = locks.length > 0 ? Math.max(...locks.map(l => l.queue_position)) + 1 : 1;

    // Insert new lock
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from('document_locks')
      .insert({
        document_id: documentId,
        document_type: documentType,
        locked_by: user.id,
        locked_by_name: `${user.firstName} ${user.lastName}`,
        locked_at: now,
        last_heartbeat: now,
        queue_position: queuePosition
      });

    if (insertError) {
      console.error('Error inserting lock:', insertError);
      throw insertError;
    }

    // Start heartbeat for this lock
    const lockKey = getLockKey(documentId, documentType);
    if (activeLocksRef.current.has(lockKey)) {
      clearInterval(activeLocksRef.current.get(lockKey));
    }

    const heartbeatInterval = setInterval(() => {
      refreshLock(documentId, documentType).catch(console.error);
    }, HEARTBEAT_INTERVAL_MS);

    activeLocksRef.current.set(lockKey, heartbeatInterval);

    // Return lock info
    const firstLock = locks[0];
    return {
      lockedBy: firstLock?.locked_by || user.id,
      lockedByName: firstLock?.locked_by_name || `${user.firstName} ${user.lastName}`,
      lockedAt: firstLock?.locked_at || now,
      queuePosition: queuePosition,
      isLocked: locks.length > 0,
      isOwnLock: locks.length === 0 || firstLock?.locked_by === user.id
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cleanupExpiredLocks, refreshLock]);

  // Release the lock
  const releaseLock = useCallback(async (documentId: string, documentType: string) => {
    if (!user) return;

    // Stop heartbeat
    const lockKey = getLockKey(documentId, documentType);
    if (activeLocksRef.current.has(lockKey)) {
      clearInterval(activeLocksRef.current.get(lockKey));
      activeLocksRef.current.delete(lockKey);
    }

    // Delete the lock
    await supabase
      .from('document_locks')
      .delete()
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .eq('locked_by', user.id);

    // Reassign queue positions for remaining locks
    const { data: remainingLocks } = await supabase
      .from('document_locks')
      .select('*')
      .eq('document_id', documentId)
      .eq('document_type', documentType)
      .order('queue_position', { ascending: true });

    if (remainingLocks && remainingLocks.length > 0) {
      for (let i = 0; i < remainingLocks.length; i++) {
        if (remainingLocks[i].queue_position !== i + 1) {
          await supabase
            .from('document_locks')
            .update({ queue_position: i + 1 })
            .eq('id', remainingLocks[i].id);
        }
      }
    }
  }, [user]);

  return (
    <DocumentLockContext.Provider
      value={{
        acquireLock,
        releaseLock,
        refreshLock,
        getLockInfo,
        checkLockStatus
      }}
    >
      {children}
    </DocumentLockContext.Provider>
  );
};

export const useDocumentLock = () => {
  const context = useContext(DocumentLockContext);
  if (!context) {
    throw new Error('useDocumentLock must be used within DocumentLockProvider');
  }
  return context;
};
