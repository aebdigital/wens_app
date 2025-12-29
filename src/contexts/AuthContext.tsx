import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, DbUser } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
  clearSession: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Helper to convert DB user to app user format
const dbUserToUser = (dbUser: DbUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  firstName: dbUser.first_name,
  lastName: dbUser.last_name,
  createdAt: dbUser.created_at,
});

// Clear all Supabase-related localStorage keys
const clearSupabaseStorage = () => {
  try {
    // Explicitly clear the configured storage key
    localStorage.removeItem('wens-auth-token');
    
    // Clear any generic Supabase keys (legacy or default)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safety function to clear session and localStorage
  const clearSession = () => {
    console.log('Clearing session and localStorage...');
    setUser(null);
    setIsLoading(false);
    clearSupabaseStorage();
    supabase.auth.signOut().catch(() => {});
  };

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Safety timeout - if loading takes more than 8 seconds, force show login
    // This catches any edge case where the flow gets stuck
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Auth loading timeout - forcing login screen');
      setUser(null);
      setIsLoading(false);
      // Clear potentially corrupted localStorage
      clearSupabaseStorage();
    }, 8000);

    // Check for existing Supabase Auth session
    const checkSession = async () => {
      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session check timed out')), 5000);
      });

      try {
        // Race the session check against the timeout
        // Get session without aggressive timeout - let Supabase handle it
        const { data, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise.then(() => { throw new Error('Session check timed out'); })
        ]) as any;

        if (sessionError) {
          console.error('Session check error:', sessionError);
          setIsLoading(false);
          return;
        }

        const session = data?.session; // Handle potentially undefined data structure from race result

        if (session?.user) {
          // Check if token is expired
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);

          // If token is expired, just show login - don't aggressively clear
          if (expiresAt && expiresAt < now) {
            console.log('Session expired, showing login...');
            setIsLoading(false);
            return;
          }

          // Try to refresh if expiring within 5 minutes
          if (expiresAt && expiresAt - now < 300) {
            try {
              await supabase.auth.refreshSession();
            } catch (refreshError) {
              console.warn('Token refresh failed, showing login');
              setIsLoading(false);
              return;
            }
          }

          // Fetch user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            setUser(dbUserToUser(profile as DbUser));
          } else {
            // Profile fetch failed - just log, don't destroy session
            console.error('Profile fetch failed:', error);
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        // On error, just show login - don't aggressively clear localStorage
        setUser(null);
      } finally {
        // Always clear the safety timeout and set loading to false
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        setIsLoading(false);
      }
    };

    checkSession();

    // Helper to fetch and set user profile
    const fetchAndSetProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && profile) {
          setUser(dbUserToUser(profile as DbUser));
          return true;
        } else {
          console.error('Failed to fetch profile:', error);
          return false;
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        return false;
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndSetProfile(session.user.id);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Session was refreshed - ensure user state is still valid
        console.log('Token refreshed successfully');
        // If user was somehow lost, restore it
        setUser(currentUser => {
          if (!currentUser && session?.user) {
            // User state was lost, refetch profile
            fetchAndSetProfile(session.user.id);
          }
          return currentUser;
        });
      } else if (event === 'INITIAL_SESSION') {
        // Initial session check completed - handled by checkSession above
        // But ensure loading is false if no session
        if (!session) {
          setIsLoading(false);
        }
      }
    });

    // Handle visibility change - refresh session when user returns to tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Check if token needs refresh (within 10 minutes of expiry)
            const expiresAt = session.expires_at;
            const now = Math.floor(Date.now() / 1000);
            if (expiresAt && expiresAt - now < 600) {
              console.log('Token expiring soon, refreshing...');
              await supabase.auth.refreshSession();
            }
          }
        } catch (error) {
          console.warn('Failed to check/refresh session on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Safety timeout to prevent infinite loading
    const loginTimeout = setTimeout(() => {
      if (isLoading) {
        console.error('Login timed out');
        setIsLoading(false);
      }
    }, 15000); // 15 seconds max

    try {
      setIsLoading(true);

      // Don't clear localStorage before login - let Supabase handle the session
      // Only clear on actual failures

      // Login with Supabase - no timeout wrapper, let it complete naturally
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(loginTimeout);

      if (error || !data?.user) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }

      // Fetch user profile directly instead of relying on onAuthStateChange
      // This ensures we always get the profile after successful login
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profile) {
          setUser(dbUserToUser(profile as DbUser));
        } else {
          console.error('Failed to fetch profile after login:', profileError);
          // Even if profile fetch fails, the auth succeeded
          // The user will be set when onAuthStateChange fires
        }
      } catch (profileFetchError) {
        console.error('Profile fetch error:', profileFetchError);
        // Don't fail the login if just the profile fetch failed
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    // Clear user immediately for instant UI response
    setUser(null);

    // Clear localStorage and sign out
    clearSupabaseStorage();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password update error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  };

  const value = {
    user,
    login,
    logout,
    changePassword,
    clearSession,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
