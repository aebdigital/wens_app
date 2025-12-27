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

// Helper to add timeout to promises
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Check for existing Supabase Auth session
    const checkSession = async () => {
      try {
        // Add timeout to prevent hanging
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );

        if (session?.user) {
          // Try to refresh if token is expiring soon (within 5 minutes)
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt && expiresAt - now < 300) {
            try {
              await withTimeout(supabase.auth.refreshSession(), 5000);
            } catch (refreshError) {
              console.warn('Token refresh failed, continuing with current session');
            }
          }

          // Fetch user profile from users table
          const fetchProfile = async () => {
            return supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
          };

          const { data: profile, error } = await withTimeout(fetchProfile(), 5000);

          if (!error && profile) {
            setUser(dbUserToUser(profile as DbUser));
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        // On timeout or error, clear any stale state and let user re-login
        setUser(null);
      }
      setIsLoading(false);
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
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
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
        }
      } catch (profileFetchError) {
        console.error('Profile fetch error:', profileFetchError);
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
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsLoading(false);
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
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
