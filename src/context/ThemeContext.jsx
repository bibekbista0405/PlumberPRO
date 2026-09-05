import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('plumbpro_theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('plumbpro_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light');
  const value = useMemo(() => ({ theme, toggleTheme, isDark: theme === 'dark' }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
