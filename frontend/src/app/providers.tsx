'use client';

import React, { useEffect } from 'react';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { DisplayProvider } from '../context/DisplayContext';
import { AuthModal } from '../components/AuthModal';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
    }
  }, []);

  return (
    <LanguageProvider>
      <DisplayProvider>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </DisplayProvider>
    </LanguageProvider>
  );
}
