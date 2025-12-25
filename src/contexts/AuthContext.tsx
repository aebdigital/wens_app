import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase Auth session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            setUser(dbUserToUser(profile));
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      }
      setIsLoading(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile from users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          setUser(dbUserToUser(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('Login error:', error);
        return false;
      }

      // User profile will be fetched by onAuthStateChange listener
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
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
