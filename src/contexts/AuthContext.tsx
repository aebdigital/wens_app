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
        // Initial session check completed
        if (session?.user) {
          // If we have a session, fetch profile (even if user state might already be set by SIGNED_IN, ensure it's fresh)
          await fetchAndSetProfile(session.user.id);
        }
        // Always stop loading after initial check, regardless of session presence
        setIsLoading(false);
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
