'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../lib/translations';
import { CitizenPhoneAuthFlow } from './CitizenPhoneAuthFlow';
import { X } from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  if (!isAuthModalOpen) return null;

  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-gray-100 my-8">
        {/* Header with Language Switcher and Close Button */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              R
            </div>
            <span className="font-extrabold text-sm text-gray-900 tracking-tight">
              {t('appTitle')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px]">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                    language === l.code
                      ? 'bg-white text-orange-600 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={closeAuthModal}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unified Passwordless Citizen Auth Flow */}
        <CitizenPhoneAuthFlow onSuccess={closeAuthModal} inModal={true} />
      </div>
    </div>
  );
}
