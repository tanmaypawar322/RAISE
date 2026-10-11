'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'normal' | 'large' | 'xlarge';

export const FONT_SIZE_LABELS: Record<FontSize, { label: string; labelMr: string; labelHi: string; desc: string; descMr: string; descHi: string }> = {
  normal: { label: 'Standard', labelMr: 'प्रमाणित', labelHi: 'मानक', desc: 'Standard comfortable text', descMr: 'प्रमाणित वाचन आकार', descHi: 'मानक वाचन आकार' },
  large: { label: 'Large', labelMr: 'मोठे', labelHi: 'बड़ा', desc: 'Enhanced text clarity', descMr: 'अधिक स्पष्ट आकार', descHi: 'अधिक स्पष्ट आकार' },
  xlarge: { label: 'Extra Large', labelMr: 'अधिक मोठे', labelHi: 'बहुत बड़ा', desc: 'Maximum readability', descMr: 'कमाल वाचन सुलभता', descHi: 'अधिकतम वाचन सुलभता' },
};

interface DisplayContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  isDark: boolean;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export function DisplayProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('raise_theme') as ThemeMode) || 'light';
      const savedFontSize = (localStorage.getItem('raise_font_size') as FontSize) || 'normal';
      setThemeState(savedTheme);
      setFontSizeState(savedFontSize);
      applyTheme(savedTheme);
      applyFontSize(savedFontSize);
    }
  }, []);

  // System theme listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const applyTheme = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    let dark = false;
    if (mode === 'dark') {
      dark = true;
    } else if (mode === 'system') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(dark);
    if (dark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const applyFontSize = (size: FontSize) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    switch (size) {
      case 'large':
        root.style.fontSize = '18.1px'; // +10%
        break;
      case 'xlarge':
        root.style.fontSize = '19.8px'; // +20%
        break;
      case 'normal':
      default:
        root.style.fontSize = '16.5px'; // Comfortable baseline
        break;
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('raise_theme', newTheme);
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    if (typeof window !== 'undefined') {
      localStorage.setItem('raise_font_size', newSize);
    }
    applyFontSize(newSize);
  };

  return (
    <DisplayContext.Provider value={{ theme, setTheme, toggleTheme, fontSize, setFontSize, isDark }}>
      {children}
    </DisplayContext.Provider>
  );
}

export function useDisplay() {
  const context = useContext(DisplayContext);
  if (!context) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
}
