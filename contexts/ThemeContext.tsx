import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type AppliedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: AppliedTheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to system
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    return (localStorage.getItem('providencia-theme-pref') as ThemePreference) || 'system';
  });

  const [theme, setTheme] = useState<AppliedTheme>('light');

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem('providencia-theme-pref', pref);
  };

  useEffect(() => {
    const getSystemTheme = (): AppliedTheme => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    const applyTheme = () => {
      let newTheme: AppliedTheme = 'light';
      if (preference === 'system') {
        newTheme = getSystemTheme();
      } else {
        newTheme = preference;
      }
      
      setTheme(newTheme);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preference === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};