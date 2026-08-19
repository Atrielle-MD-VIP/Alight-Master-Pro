import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('alight_theme') === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('alight_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('alight_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, toggleTheme };
}
