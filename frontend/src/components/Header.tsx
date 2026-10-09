'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  FileText,
  Building2,
  Briefcase,
  ShieldAlert,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { Language } from '../lib/translations';
import { AppTab } from './BottomNav';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  onSignInClick?: () => void;
}

export function Header({ activeTab = 'home', onTabChange, onSignInClick }: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, openAuthModal, logout } = useAuth();

  const handleTabClick = (tab: AppTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      if (tab === 'home') router.push('/');
      else if (tab === 'my_issues') router.push('/dashboard');
      else if (tab === 'office_portal') router.push('/office-portal');
      else if (tab === 'admin') router.push('/admin');
      else router.push('/');
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-extrabold text-xl shadow-xs group-hover:scale-105 transition">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">
                {t('appTitle')}
              </span>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded">
                PILOT
              </span>
            </div>
            <p className="text-[10px] text-gray-500 hidden sm:block tracking-tight font-medium">
              Report &bull; Amplify &bull; Inform &bull; Solve &bull; Escalate
            </p>
          </div>
        </button>

        {/* Desktop Tabs Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => handleTabClick('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'home'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{t('navFeed')}</span>
          </button>

          <button
            onClick={() => {
              if (!user) openAuthModal();
              else handleTabClick('my_issues');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'my_issues'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('navMyIssues')}</span>
          </button>

          <button
            onClick={() => handleTabClick('offices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'offices'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('navOffices')}</span>
          </button>

          {/* Role specific tabs */}
          {user?.role === 'official' && (
            <button
              onClick={() => handleTabClick('office_portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'office_portal'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-blue-700 hover:text-blue-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{t('navPortal')}</span>
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleTabClick('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'admin'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-purple-700 hover:text-purple-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('navAdmin')}</span>
            </button>
          )}

          {user && (
            <button
              onClick={() => handleTabClick('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'profile'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t('navProfile')}</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Language & Auth */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 text-xs">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-1 rounded-lg font-medium transition ${
                  language === l.code
                    ? 'bg-white text-orange-600 shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Notification Bell */}
          <NotificationBell onOpenPreferences={() => handleTabClick('profile')} />

          {/* User Account or Sign In */}
          {user ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
              <div
                onClick={() => handleTabClick('profile')}
                className="cursor-pointer flex items-center gap-1.5 text-left"
              >
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-gray-900 block leading-tight truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-orange-600 block">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="text-gray-400 hover:text-red-600 ml-1 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onSignInClick) onSignInClick();
                else openAuthModal();
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t('signIn')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
