import React, { createContext, useContext, useEffect, useState } from 'react';

const LIGHT = {
  '--bg-page':       '#f1f5f9',
  '--bg-surface':    '#ffffff',
  '--bg-subtle':     '#f8fafc',
  '--bg-hover':      '#f8fafc',
  '--border':        '#e2e8f0',
  '--border-strong': '#cbd5e1',
  '--text-primary':  '#0f172a',
  '--text-secondary':'#64748b',
  '--text-muted':    '#94a3b8',
  '--accent':        '#4f46e5',
  '--accent-light':  '#818cf8',
  '--accent-bg':     '#eef2ff',
  '--accent-border': '#c7d2fe',
  '--sidebar-bg':    '#0f172a',
  '--sidebar-hover': '#1e293b',
  '--sidebar-border':'rgba(255,255,255,0.06)',
  '--sidebar-text':  '#94a3b8',
  '--sidebar-active':'#ffffff',
};

const DARK = {
  '--bg-page':       '#0f172a',
  '--bg-surface':    '#1e293b',
  '--bg-subtle':     '#162032',
  '--bg-hover':      '#243347',
  '--border':        '#334155',
  '--border-strong': '#475569',
  '--text-primary':  '#f1f5f9',
  '--text-secondary':'#94a3b8',
  '--text-muted':    '#64748b',
  '--accent':        '#818cf8',
  '--accent-light':  '#a5b4fc',
  '--accent-bg':     '#1e1b4b',
  '--accent-border': '#3730a3',
  '--sidebar-bg':    '#020617',
  '--sidebar-hover': '#0f172a',
  '--sidebar-border':'rgba(255,255,255,0.06)',
  '--sidebar-text':  '#94a3b8',
  '--sidebar-active':'#ffffff',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const tokens = isDark ? DARK : LIGHT;
    Object.entries(tokens).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
