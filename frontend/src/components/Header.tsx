'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Sparkles,
  Plus,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Briefcase,
} from 'lucide-react';
import { Language } from '../lib/translations';
import { AppTab } from './BottomNav';
import { NotificationBell } from './NotificationBell';

export interface HeaderProps {
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  onSignInClick?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenRaiseModal?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({
  activeTab = 'home',
  onTabChange,
  onSignInClick,
  onToggleSidebar,
  isSidebarCollapsed,
  onOpenRaiseModal,
  title,
  subtitle,
}: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, openAuthModal, logout } = useAuth();

  const handleTabClick = (tab: AppTab) => {
    if (tab === 'home') {
      if (onTabChange) onTabChange('home');
      else router.push('/');
    } else if (tab === 'my_issues') {
      router.push('/dashboard');
    } else if (tab === 'offices') {
      router.push('/offices');
    } else if (tab === 'office_portal') {
      router.push('/office-portal');
    } else if (tab === 'admin') {
      router.push('/admin');
    } else if (tab === 'profile') {
      if (user?.role === 'admin') router.push('/admin');
      else if (user?.role === 'official' || user?.role === 'agency') router.push('/office-portal');
      else router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle & Contextual Brand / Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer shrink-0"
              title="Toggle Navigation Sidebar"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Contextual Title or Wordmark */}
          {title ? (
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-black text-gray-900 truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-gray-500 truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 group text-left cursor-pointer md:hidden"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs shrink-0">
                R
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base text-gray-900 tracking-tight">
                  {t('appTitle')}
                </span>
                <span className="text-[9px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded uppercase">
                  Pilot
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Pilot Ward Indicator Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span>Ward 12 (Nigdi)</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 text-xs font-bold">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  language === l.code
                    ? 'bg-white text-orange-600 shadow-xs font-extrabold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Notification Bell */}
          <NotificationBell onOpenPreferences={() => handleTabClick('profile')} />

          {/* "+ Report Grievance" Button */}
          {onOpenRaiseModal ? (
            <button
              type="button"
              onClick={onOpenRaiseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{t('raiseIssueBtn')}</span>
            </button>
          ) : (
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('raiseIssueBtn')}</span>
            </Link>
          )}

          {/* User Profile Avatar or Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 text-xs">
              <button
                onClick={() => handleTabClick('profile')}
                className="flex items-center gap-1.5 text-left cursor-pointer"
                title={`Signed in as ${user.name} (${user.role})`}
              >
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:block max-w-[90px] truncate">
                  <span className="font-bold text-gray-900 block truncate text-[11px] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-orange-600 block">
                    {user.role}
                  </span>
                </div>
              </button>

              <button
                onClick={logout}
                title="Sign out"
                className="text-gray-400 hover:text-red-600 p-1 transition cursor-pointer"
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
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
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
