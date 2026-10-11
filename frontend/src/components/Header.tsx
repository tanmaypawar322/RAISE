'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Compass,
  ChevronDown,
  Users,
  Vote,
  Receipt,
  Scale,
  HeartHandshake,
  Tag,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  Sparkles,
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

  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab: AppTab) => {
    setIsExploreOpen(false);
    setIsMobileMenuOpen(false);
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

  const handleNavDirect = (path: string) => {
    setIsExploreOpen(false);
    setIsMobileMenuOpen(false);
    router.push(path);
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
        <div className="flex items-center gap-2">
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
        </div>

        {/* Desktop Tabs & Explore Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {/* Explore Platform Dropdown */}
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => setIsExploreOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isExploreOpen
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={t('explorePlatform')}
            >
              <Compass className={`w-3.5 h-3.5 ${isExploreOpen ? 'text-orange-600' : 'text-gray-500'}`} />
              <span>{t('explorePlatform')}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExploreOpen ? 'rotate-180 text-orange-600' : ''}`} />
            </button>

            {/* Dropdown Menu Modal */}
            {isExploreOpen && (
              <div className="absolute left-0 mt-2 w-[520px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>{t('explorePlatform')}</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {t('exploreSubtitle')}
                    </p>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                    9 Civic Modules
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Column 1: Civic Democracy */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 px-2 py-1">
                      नागरी लोकशाही (Civic Action)
                    </p>
                    <button
                      onClick={() => handleNavDirect('/')}
                      className="w-full text-left p-2 rounded-xl hover:bg-orange-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Flame className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-orange-600">
                          {t('navFeed')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          थेट नागरी तक्रारी व पाठपुरावा
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/representatives')}
                      className="w-full text-left p-2 rounded-xl hover:bg-blue-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-blue-700">
                          {t('navRepresentatives')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          नगरसेवक, आमदार व खासदार गुणपत्रिका
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/townhalls')}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Vote className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-emerald-700">
                          {t('navTownhalls')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          डिजिटल ग्रामसभा व सामूहिक मतदान
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/offices')}
                      className="w-full text-left p-2 rounded-xl hover:bg-purple-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-purple-700">
                          {t('navOffices')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          शासकीय कार्यालये व नोडल अधिकारी
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Column 2: Governance & Transparency */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 px-2 py-1">
                      पारदर्शकता व नीतिमत्ता
                    </p>
                    <button
                      onClick={() => handleNavDirect('/transparency')}
                      className="w-full text-left p-2 rounded-xl hover:bg-amber-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-amber-700">
                          {t('navTransparency')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          १००% खुला सार्वजनिक ताळेबंद
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/pricing')}
                      className="w-full text-left p-2 rounded-xl hover:bg-teal-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-teal-700">
                          {t('navPricing')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          शून्य जाहिरात महसूल व निष्पक्षता
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/reports')}
                      className="w-full text-left p-2 rounded-xl hover:bg-sky-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-sky-700">
                          {t('navReports')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          प्रशासकीय मासिक कामकाज अहवाल
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/governance')}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-slate-700">
                          {t('navGovernance')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          ५-स्तंभीय तटस्थ मूल्यमापन पद्धती
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavDirect('/support')}
                      className="w-full text-left p-2 rounded-xl hover:bg-rose-50 group flex items-start gap-2.5 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                        <HeartHandshake className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block group-hover:text-rose-700">
                          {t('navSupport')}
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1 block">
                          नागरी सहकार्य व लोकशाही निधी
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer with Role Portals */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] bg-gray-50 -mx-4 -mb-4 p-3 rounded-b-2xl">
                  <span className="font-bold text-gray-500">
                    विशिष्ट भूमिका पोर्टल:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNavDirect('/dashboard')}
                      className="font-bold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <UserIcon className="w-3 h-3" />
                      <span>नागरिक डॅशबोर्ड</span>
                    </button>
                    <span className="text-gray-300">&bull;</span>
                    <button
                      onClick={() => handleNavDirect('/office-portal')}
                      className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>शासकीय पोर्टल</span>
                    </button>
                    <span className="text-gray-300">&bull;</span>
                    <button
                      onClick={() => handleNavDirect('/admin')}
                      className="font-bold text-purple-700 hover:underline flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>प्रशासक</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Nav Tabs */}
          <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => handleTabClick('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'offices'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('navOffices')}</span>
            </button>

            {/* Role specific tabs */}
            {(user?.role === 'official' || user?.role === 'agency') && (
              <button
                onClick={() => handleTabClick('office_portal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
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
        </div>

        {/* Right Actions: Language, Notification, Auth & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Explore Button */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center gap-1 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            title={t('explorePlatform')}
          >
            <Compass className="w-4 h-4 text-orange-600" />
            <span className="text-[11px] font-extrabold hidden xs:inline">Explore</span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 text-xs">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
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
              <button
                onClick={() => handleTabClick('profile')}
                className="flex items-center gap-1.5 text-left cursor-pointer"
                title={`Go to ${user.role} workspace`}
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
              </button>

              <button
                onClick={logout}
                title="Sign out"
                className="text-gray-400 hover:text-red-600 ml-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onSignInClick) onSignInClick();
                else router.push('/sign-in');
              }}
              className="flex items-center gap-1 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t('signIn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <span className="text-xs font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{t('explorePlatform')}</span>
              </span>
              <p className="text-[11px] text-gray-500">{t('exploreSubtitle')}</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Panels Strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <button
              onClick={() => handleNavDirect('/dashboard')}
              className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 font-bold flex flex-col items-center gap-1"
            >
              <UserIcon className="w-4 h-4 text-orange-600" />
              <span className="text-[11px]">नागरिक डॅशबोर्ड</span>
            </button>
            <button
              onClick={() => handleNavDirect('/office-portal')}
              className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-bold flex flex-col items-center gap-1"
            >
              <Briefcase className="w-4 h-4 text-blue-700" />
              <span className="text-[11px]">शासकीय पोर्टल</span>
            </button>
            <button
              onClick={() => handleNavDirect('/admin')}
              className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-bold flex flex-col items-center gap-1"
            >
              <ShieldAlert className="w-4 h-4 text-purple-700" />
              <span className="text-[11px]">प्रशासक</span>
            </button>
          </div>

          {/* Civic Modules List */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400 px-1 pt-1">नागरी व लोकशाही विभाग</p>
            <button
              onClick={() => handleNavDirect('/')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Flame className="w-4 h-4 text-orange-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navFeed')}</span>
                <span className="text-[10px] text-gray-500">थेट नागरी तक्रारी व पाठपुरावा</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/representatives')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navRepresentatives')}</span>
                <span className="text-[10px] text-gray-500">लोकप्रतिनिधी कामगिरी गुणपत्रिका</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/townhalls')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Vote className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navTownhalls')}</span>
                <span className="text-[10px] text-gray-500">डिजिटल ग्रामसभा व मतदान</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/offices')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navOffices')}</span>
                <span className="text-[10px] text-gray-500">शासकीय कार्यालये व नोडल अधिकारी</span>
              </div>
            </button>

            <p className="text-[10px] font-black uppercase text-gray-400 px-1 pt-3">पारदर्शकता व नीतिमत्ता</p>

            <button
              onClick={() => handleNavDirect('/transparency')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navTransparency')}</span>
                <span className="text-[10px] text-gray-500">१००% खुला सार्वजनिक ताळेबंद</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/pricing')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Tag className="w-4 h-4 text-teal-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navPricing')}</span>
                <span className="text-[10px] text-gray-500">शून्य जाहिरात महसूल व निष्पक्षता</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/reports')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <FileText className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navReports')}</span>
                <span className="text-[10px] text-gray-500">मासिक प्रशासकीय कार्य अहवाल</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/governance')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <Scale className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navGovernance')}</span>
                <span className="text-[10px] text-gray-500">५-स्तंभीय तटस्थ मूल्यमापन पद्धती</span>
              </div>
            </button>

            <button
              onClick={() => handleNavDirect('/support')}
              className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3 border border-gray-100"
            >
              <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-900 block">{t('navSupport')}</span>
                <span className="text-[10px] text-gray-500">नागरी सहकार्य व लोकशाही निधी</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
