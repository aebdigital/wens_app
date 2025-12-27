import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Start with localStorage for immediate render (avoids flash)
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });
  const [userId, setUserId] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(false);

  // Listen for auth state changes to get user ID
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load theme from Supabase when user is available
  useEffect(() => {
    const loadThemeFromSupabase = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading theme:', error);
          return;
        }

        if (data?.theme) {
          const supabaseTheme = data.theme as Theme;
          setThemeState(supabaseTheme);
          localStorage.setItem('theme', supabaseTheme);
        }
      } catch (error) {
        console.error('Failed to load theme from Supabase:', error);
      }
    };

    loadThemeFromSupabase();
  }, [userId]);

  useEffect(() => {
    const updateDarkMode = () => {
      let shouldBeDark = false;

      if (theme === 'dark') {
        shouldBeDark = true;
      } else if (theme === 'auto') {
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDark(shouldBeDark);

      // Apply dark class to document
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateDarkMode();

    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    // Save to Supabase if user is logged in
    if (userId) {
      try {
        // Check if preferences exist
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existing) {
          await supabase
            .from('user_preferences')
            .update({ theme: newTheme, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_preferences')
            .insert({ user_id: userId, theme: newTheme });
        }
      } catch (error) {
        console.error('Failed to save theme to Supabase:', error);
      }
    }
  }, [userId]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
