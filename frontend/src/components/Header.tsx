'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useDisplay, ThemeMode, FontSize, FONT_SIZE_LABELS } from '../context/DisplayContext';
import {
  Menu,
  Plus,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Laptop,
  Languages,
  ChevronDown,
  Type,
  Check,
  Building,
  Shield,
  UserCheck,
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
  const { theme, setTheme, toggleTheme, fontSize, setFontSize, isDark } = useDisplay();

  // Dropdown menus state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
        setIsFontSizeOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const languagesList: { code: Language; label: string; nativeName: string }[] = [
    { code: 'mr', label: 'MR', nativeName: 'मराठी (Marathi)' },
    { code: 'hi', label: 'HI', nativeName: 'हिंदी (Hindi)' },
    { code: 'en', label: 'EN', nativeName: 'English (English)' },
  ];

  const currentLang = languagesList.find((l) => l.code === language) || languagesList[0];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' };
      case 'official':
      case 'agency':
        return { label: 'Verified Official', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' };
      default:
        return { label: 'Citizen', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Sidebar Toggle & Contextual Brand / Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 -ml-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer shrink-0"
              title="Toggle Navigation Sidebar"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Contextual Title or Wordmark */}
          {title ? (
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate hidden sm:block">
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
                <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
                  {t('appTitle')}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* 1-Click Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer border border-gray-200 dark:border-gray-700"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Dedicated Text Size Menu (No px numbers) */}
          <div className="relative" ref={fontSizeRef}>
            <button
              type="button"
              onClick={() => {
                setIsFontSizeOpen((prev) => !prev);
                setIsLangOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer border border-gray-200 dark:border-gray-700 text-xs font-bold"
              title="Text Readability & Font Size"
              aria-label="Text readability selector"
            >
              <span className="font-black text-sm tracking-tighter">Aa</span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 hidden md:inline">
                {fontSize === 'normal' ? 'Standard' : fontSize === 'large' ? 'Large' : 'XL'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isFontSizeOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 px-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Text Readability
                </div>
                <div className="space-y-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFontSize('normal');
                      setIsFontSizeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition ${
                      fontSize === 'normal'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-extrabold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">{FONT_SIZE_LABELS.normal.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal">Optimal baseline size</span>
                    </div>
                    {fontSize === 'normal' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFontSize('large');
                      setIsFontSizeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition ${
                      fontSize === 'large'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-extrabold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">{FONT_SIZE_LABELS.large.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal">Enhanced text clarity</span>
                    </div>
                    {fontSize === 'large' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFontSize('xlarge');
                      setIsFontSizeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition ${
                      fontSize === 'xlarge'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-extrabold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">{FONT_SIZE_LABELS.xlarge.label}</span>
                      <span className="text-[10px] text-gray-400 font-normal">Maximum readability</span>
                    </div>
                    {fontSize === 'xlarge' && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => {
                setIsLangOpen((prev) => !prev);
                setIsFontSizeOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer border border-gray-200 dark:border-gray-700 text-xs font-bold"
              title="Select Platform Language"
              aria-label="Language selector"
            >
              <Languages className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span>{currentLang.label}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Select Language
                </div>
                {languagesList.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition font-bold ${
                      language === l.code
                        ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-extrabold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{l.nativeName}</span>
                    {language === l.code && <Check className="w-3.5 h-3.5 text-orange-600" />}
                  </button>
                ))}
              </div>
            )}
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

          {/* User Profile Avatar with Dropdown */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsLangOpen(false);
                  setIsFontSizeOpen(false);
                }}
                className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center text-[11px] shrink-0">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:block max-w-[90px] truncate text-left">
                  <span className="font-bold text-gray-900 dark:text-white block truncate text-[11px] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-orange-600 dark:text-orange-400 block">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email || user.phoneMasked}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  </div>

                  <div className="py-1">
                    {user.role === 'citizen' && (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-orange-500" />
                        <span>Citizen Dashboard</span>
                      </Link>
                    )}
                    {(user.role === 'official' || user.role === 'agency') && (
                      <Link
                        href="/office-portal"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold"
                      >
                        <Building className="w-3.5 h-3.5 text-blue-500" />
                        <span>Official Portal</span>
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-500" />
                        <span>Administrator Console</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold text-left transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('signOutBtn')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (onSignInClick) onSignInClick();
                else openAuthModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
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
