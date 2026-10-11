'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Flame,
  Users,
  Building,
  Building2,
  Wallet,
  ShieldCheck,
  ChevronDown,
  Clock,
  ThumbsUp,
  Bell,
  Shield,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Layers,
  MessageSquare,
  FileText,
  Award,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Scale,
  MapPin,
  KeyRound,
  HelpCircle,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [activeTabParam, setActiveTabParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      setActiveTabParam(sp.get('tab'));
    }
  }, [pathname]);

  const { user, logout, openAuthModal, openAuthModalWithAction } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Accordion open/close states
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    citizen: false,
    official: false,
    admin: false,
  });

  // Automatically expand corresponding accordion if user is on that route
  useEffect(() => {
    if (pathname.startsWith('/dashboard')) {
      setOpenAccordions((prev) => ({ ...prev, citizen: true }));
    } else if (pathname.startsWith('/office-portal')) {
      setOpenAccordions((prev) => ({ ...prev, official: true }));
    } else if (pathname.startsWith('/admin')) {
      setOpenAccordions((prev) => ({ ...prev, admin: true }));
    }
  }, [pathname]);

  const toggleAccordion = (key: string) => {
    if (isCollapsed) {
      onToggleCollapse(); // expand sidebar if user clicks an accordion while collapsed
    }
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isNavActive = (href: string, tab?: string) => {
    if (tab) {
      return pathname === href && activeTabParam === tab;
    }
    return pathname === href && !activeTabParam;
  };

  const handleLinkClick = () => {
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out select-none shadow-xs ${
          isMobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-14 border-b border-gray-100 px-3.5 flex items-center justify-between shrink-0 bg-white">
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`flex items-center gap-2.5 overflow-hidden transition ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            title="RAISE Homepage"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
              R
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-sm tracking-tight text-gray-900">RAISE</span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    Pilot
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
                  Citizen Voice
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle / Mobile Close Button */}
          <div className="flex items-center">
            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg md:hidden cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                title={t('collapseSidebar')}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
          
          {/* SECTION 1: CIVIC MODULES */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                <span>{t('civicModules')}</span>
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-mono">6</span>
              </div>
            )}

            {/* 1. Grievance Feed */}
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                pathname === '/' && !activeTabParam
                  ? 'bg-orange-50 text-orange-900 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={t('navFeed')}
            >
              <Flame className={`w-4 h-4 shrink-0 ${pathname === '/' && !activeTabParam ? 'text-orange-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span className="truncate">{t('navFeed')}</span>}
            </Link>

            {/* 2. Elected Representatives */}
            <Link
              href="/representatives"
              onClick={handleLinkClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/representatives')
                  ? 'bg-orange-50 text-orange-900 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={t('navRepresentatives')}
            >
              <Users className={`w-4 h-4 shrink-0 ${pathname.startsWith('/representatives') ? 'text-orange-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span className="truncate">{t('navRepresentatives')}</span>}
            </Link>

            {/* 3. Townhalls (Digital Gram Sabha) */}
            <Link
              href="/townhalls"
              onClick={handleLinkClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/townhalls')
                  ? 'bg-orange-50 text-orange-900 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={t('navTownhalls')}
            >
              <Building className={`w-4 h-4 shrink-0 ${pathname.startsWith('/townhalls') ? 'text-orange-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span className="truncate">{t('navTownhalls')}</span>}
            </Link>

            {/* 4. Public Offices Directory */}
            <Link
              href="/offices"
              onClick={handleLinkClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                pathname.startsWith('/offices')
                  ? 'bg-orange-50 text-orange-900 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={t('navOffices')}
            >
              <Building2 className={`w-4 h-4 shrink-0 ${pathname.startsWith('/offices') ? 'text-orange-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span className="truncate">{t('navOffices')}</span>}
            </Link>

            {/* 5. Transparency Ledger */}
            <Link
              href="/transparency"
              onClick={handleLinkClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                pathname === '/transparency'
                  ? 'bg-orange-50 text-orange-900 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={t('navTransparency')}
            >
              <Wallet className={`w-4 h-4 shrink-0 ${pathname === '/transparency' ? 'text-orange-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span className="truncate">{t('navTransparency')}</span>}
            </Link>

            {/* 6. Moderation Logs */}
            <Link
              href="/transparency/moderation"
              onClick={handleLinkClick}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                pathname === '/transparency/moderation'
                  ? 'bg-orange-50 text-orange-900 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Moderation Audit Logs"
            >
              <ShieldCheck className={`w-4 h-4 shrink-0 ${pathname === '/transparency/moderation' ? 'text-orange-600' : 'text-gray-500'}`} />
              {!isCollapsed && <span className="truncate">Moderation Logs</span>}
            </Link>
          </div>

          {/* SECTION 2: WORKSPACES & ACCORDION SUB-TABS */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                {t('workspaces')}
              </div>
            )}

            {/* CITIZEN DASHBOARD ACCORDION */}
            <div className="rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('citizen')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-orange-50/70 text-orange-950 font-black'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={t('myDashboard')}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <User className="w-4 h-4 text-orange-500 shrink-0" />
                  {!isCollapsed && <span className="truncate">{t('myDashboard')}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      openAccordions.citizen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Citizen Sub-tabs */}
              {!isCollapsed && openAccordions.citizen && (
                <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-orange-100 ml-4 mt-1">
                  <Link
                    href="/dashboard?tab=my_grievances"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/dashboard' && (activeTabParam === 'my_grievances' || !activeTabParam)
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabMyGrievances')}</span>
                  </Link>

                  <Link
                    href="/dashboard?tab=supported_issues"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/dashboard' && activeTabParam === 'supported_issues'
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabBackedIssues')}</span>
                  </Link>

                  <Link
                    href="/dashboard?tab=my_representatives"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/dashboard' && activeTabParam === 'my_representatives'
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabMyReps')}</span>
                  </Link>

                  <Link
                    href="/dashboard?tab=townhall_activity"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/dashboard' && activeTabParam === 'townhall_activity'
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabTownhallActivity')}</span>
                  </Link>

                  <Link
                    href="/dashboard?tab=notifications"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/dashboard' && activeTabParam === 'notifications'
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabNotificationsPref')}</span>
                  </Link>

                  <Link
                    href="/dashboard?tab=profile"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/dashboard' && activeTabParam === 'profile'
                        ? 'bg-orange-100 text-orange-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabPrivacyDpdp')}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* OFFICIAL PORTAL ACCORDION */}
            <div className="rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('official')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pathname.startsWith('/office-portal')
                    ? 'bg-blue-50/70 text-blue-950 font-black'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={t('navPortal')}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                  {!isCollapsed && <span className="truncate">{t('navPortal')}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      openAccordions.official ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Official Sub-tabs */}
              {!isCollapsed && openAccordions.official && (
                <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-blue-100 ml-4 mt-1">
                  <Link
                    href="/office-portal?tab=queue"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/office-portal' && (activeTabParam === 'queue' || !activeTabParam)
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabAssignedQueue')}</span>
                  </Link>

                  <Link
                    href="/office-portal?tab=resolution"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/office-portal' && activeTabParam === 'resolution'
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabResolutionDesk')}</span>
                  </Link>

                  <Link
                    href="/office-portal/analysis"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/office-portal/analysis'
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabDeptAnalytics')}</span>
                  </Link>

                  <Link
                    href="/office-portal/directives"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/office-portal/directives'
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabBindingDirectives')}</span>
                  </Link>

                  <Link
                    href="/office-portal/representative"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/office-portal/representative'
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabRepInquiries')}</span>
                  </Link>

                  <Link
                    href="/office-portal?tab=scorecard"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/office-portal' && activeTabParam === 'scorecard'
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('officeScorecard')}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* ADMINISTRATOR CONSOLE ACCORDION */}
            <div className="rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('admin')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-50/70 text-purple-950 font-black'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={t('adminPanel')}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  {!isCollapsed && <span className="truncate">{t('adminPanel')}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      openAccordions.admin ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Admin Sub-tabs */}
              {!isCollapsed && openAccordions.admin && (
                <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-purple-100 ml-4 mt-1">
                  <Link
                    href="/admin?tab=overview"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin' && (activeTabParam === 'overview' || !activeTabParam)
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabSystemOverview')}</span>
                  </Link>

                  <Link
                    href="/admin?tab=claims"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin' && activeTabParam === 'claims'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabClaimsQueue')}</span>
                  </Link>

                  <Link
                    href="/admin?tab=moderation"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin' && activeTabParam === 'moderation'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabModerationFlags')}</span>
                  </Link>

                  <Link
                    href="/admin/finance"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin/finance'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabFinanceLedger')}</span>
                  </Link>

                  <Link
                    href="/admin/billing"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin/billing'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabBillingPlans')}</span>
                  </Link>

                  <Link
                    href="/admin/freeze-windows"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin/freeze-windows'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabFreezeWindows')}</span>
                  </Link>

                  <Link
                    href="/admin/rep-updates"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin/rep-updates'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabRepUpdatesMod')}</span>
                  </Link>

                  <Link
                    href="/admin/outreach"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin/outreach'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('tabOutreachJur')}</span>
                  </Link>

                  <Link
                    href="/admin?tab=security"
                    onClick={handleLinkClick}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[11px] font-bold transition ${
                      pathname === '/admin' && activeTabParam === 'security'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{t('twoFactorAuth')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: BOTTOM UTILITY FOOTER */}
        <div className="p-2.5 border-t border-gray-100 bg-gray-50/60 space-y-2 shrink-0">
          {!isCollapsed ? (
            <>
              {/* Help & Governance Links */}
              <div className="space-y-0.5">
                <Link
                  href="/support"
                  onClick={handleLinkClick}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg text-gray-500 hover:text-gray-900 text-[11px] font-medium transition"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{t('helpAndSupport')}</span>
                </Link>
                <Link
                  href="/governance"
                  onClick={handleLinkClick}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg text-gray-500 hover:text-gray-900 text-[11px] font-medium transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{t('section8Governance')}</span>
                </Link>
              </div>

              {/* Language Switcher Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px] font-bold">
                <span className="text-gray-400 uppercase tracking-wider">Lang:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-1.5 py-0.5 rounded font-bold transition ${
                      language === 'en' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('mr')}
                    className={`px-1.5 py-0.5 rounded font-bold transition ${
                      language === 'mr' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    मराठी
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`px-1.5 py-0.5 rounded font-bold transition ${
                      language === 'hi' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    हिंदी
                  </button>
                </div>
              </div>

              {/* User Account / Sign In Pill */}
              <div className="pt-1 border-t border-gray-200/60">
                {user ? (
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-white border border-gray-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-gray-900 block truncate text-[11px] leading-tight">
                          {user.name}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-orange-700 bg-orange-50 px-1 rounded">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => logout()}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                      title={t('signOutBtn')}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal()}
                    className="w-full py-1.5 px-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold transition text-center shadow-2xs"
                  >
                    {t('signIn')}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Collapsed mini-rail footer icons */
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title={t('expandSidebar')}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
