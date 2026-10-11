'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Flame,
  Users,
  Building,
  Building2,
  Wallet,
  ShieldCheck,
  Shield,
  Briefcase,
  FileText,
  Award,
  BarChart3,
  Scale,
  KeyRound,
  HelpCircle,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
  User,
  UserPlus,
  ExternalLink,
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
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get('tab');

  const { user, logout, openAuthModal, openAuthModalWithAction } = useAuth();
  const { language, setLanguage, t } = useLanguage();

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
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live
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
          
          {/* UNIFIED PRIMARY ROLE NAVIGATION */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                <span>
                  {user?.role === 'admin'
                    ? t('adminConsoleTitle')
                    : user?.role === 'official' || user?.role === 'agency'
                    ? t('executivePortalTitle')
                    : user
                    ? t('citizenWorkspaceTitle')
                    : t('guestPortalTitle')}
                </span>
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-mono">
                  {user ? '6' : '4'}
                </span>
              </div>
            )}

            {/* 1. ADMINISTRATOR NAVIGATION */}
            {user?.role === 'admin' && (
              <>
                <Link
                  href="/admin?tab=telemetry"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin') && (activeTabParam === 'telemetry' || activeTabParam === 'overview' || activeTabParam === 'finance' || activeTabParam === 'billing' || pathname === '/admin/finance' || pathname === '/admin/billing' || !activeTabParam)
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navTelemetryFinance')}
                >
                  <BarChart3 className={`w-4 h-4 shrink-0 ${pathname.startsWith('/admin') && (activeTabParam === 'telemetry' || activeTabParam === 'overview' || activeTabParam === 'finance' || activeTabParam === 'billing' || pathname === '/admin/finance' || pathname === '/admin/billing' || !activeTabParam) ? 'text-amber-400' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navTelemetryFinance')}</span>}
                </Link>

                <Link
                  href="/admin?tab=claims"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin' && (activeTabParam === 'claims' || activeTabParam === 'security')
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navAffiliationClaims')}
                >
                  <KeyRound className={`w-4 h-4 shrink-0 ${pathname === '/admin' && (activeTabParam === 'claims' || activeTabParam === 'security') ? 'text-amber-400' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navAffiliationClaims')}</span>}
                </Link>

                <Link
                  href="/admin?tab=moderation"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin' && activeTabParam === 'moderation'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navIntegrityModeration')}
                >
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${pathname === '/admin' && activeTabParam === 'moderation' ? 'text-amber-400' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navIntegrityModeration')}</span>}
                </Link>

                <Link
                  href="/admin?tab=governance"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin') && (activeTabParam === 'governance' || activeTabParam === 'freeze_windows' || activeTabParam === 'rep_updates' || activeTabParam === 'outreach' || pathname === '/admin/freeze-windows' || pathname === '/admin/rep-updates' || pathname === '/admin/outreach')
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navGovernanceLegal')}
                >
                  <Scale className={`w-4 h-4 shrink-0 ${pathname.startsWith('/admin') && (activeTabParam === 'governance' || activeTabParam === 'freeze_windows' || activeTabParam === 'rep_updates' || activeTabParam === 'outreach' || pathname === '/admin/freeze-windows' || pathname === '/admin/rep-updates' || pathname === '/admin/outreach') ? 'text-amber-400' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navGovernanceLegal')}</span>}
                </Link>

                <Link
                  href="/"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/' && !activeTabParam
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navFeed')}
                >
                  <Flame className={`w-4 h-4 shrink-0 ${pathname === '/' && !activeTabParam ? 'text-amber-400' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navFeed')}</span>}
                </Link>

                <Link
                  href="/dashboard?tab=account_privacy"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/dashboard' && (activeTabParam === 'account_privacy' || activeTabParam === 'profile')
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('tabPrivacyDpdp')}
                >
                  <Shield className={`w-4 h-4 shrink-0 ${pathname === '/dashboard' && (activeTabParam === 'account_privacy' || activeTabParam === 'profile') ? 'text-amber-400' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('tabPrivacyDpdp')}</span>}
                </Link>
              </>
            )}

            {/* 2. OFFICIAL / AGENCY NAVIGATION */}
            {(user?.role === 'official' || user?.role === 'agency') && (
              <>
                <Link
                  href="/office-portal?tab=operations"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/office-portal' && (activeTabParam === 'operations' || activeTabParam === 'queue' || activeTabParam === 'resolution' || !activeTabParam)
                      ? 'bg-blue-50 text-blue-950 font-black shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navOperationsDesk')}
                >
                  <Briefcase className={`w-4 h-4 shrink-0 ${pathname === '/office-portal' && (activeTabParam === 'operations' || activeTabParam === 'queue' || activeTabParam === 'resolution' || !activeTabParam) ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navOperationsDesk')}</span>}
                </Link>

                <Link
                  href="/office-portal?tab=analytics"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/office-portal') && (activeTabParam === 'analytics' || activeTabParam === 'directives' || activeTabParam === 'analysis' || pathname === '/office-portal/analysis' || pathname === '/office-portal/directives')
                      ? 'bg-blue-50 text-blue-950 font-black shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navDirectivesAnalytics')}
                >
                  <BarChart3 className={`w-4 h-4 shrink-0 ${pathname.startsWith('/office-portal') && (activeTabParam === 'analytics' || activeTabParam === 'directives' || activeTabParam === 'analysis' || pathname === '/office-portal/analysis' || pathname === '/office-portal/directives') ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navDirectivesAnalytics')}</span>}
                </Link>

                <Link
                  href="/office-portal?tab=inquiries"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/office-portal') && (activeTabParam === 'inquiries' || activeTabParam === 'representative' || pathname === '/office-portal/representative')
                      ? 'bg-blue-50 text-blue-950 font-black shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navLegislativeInquiries')}
                >
                  <Scale className={`w-4 h-4 shrink-0 ${pathname.startsWith('/office-portal') && (activeTabParam === 'inquiries' || activeTabParam === 'representative' || pathname === '/office-portal/representative') ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navLegislativeInquiries')}</span>}
                </Link>

                <Link
                  href="/office-portal?tab=team"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/office-portal' && (activeTabParam === 'team' || activeTabParam === 'roster' || activeTabParam === 'reports' || activeTabParam === 'scorecard' || activeTabParam === 'billing')
                      ? 'bg-blue-50 text-blue-950 font-black shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navOfficeTeam')}
                >
                  <Award className={`w-4 h-4 shrink-0 ${pathname === '/office-portal' && (activeTabParam === 'team' || activeTabParam === 'roster' || activeTabParam === 'reports' || activeTabParam === 'scorecard' || activeTabParam === 'billing') ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navOfficeTeam')}</span>}
                </Link>

                <Link
                  href="/"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/' && !activeTabParam
                      ? 'bg-blue-50 text-blue-950 font-black shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navFeed')}
                >
                  <Flame className={`w-4 h-4 shrink-0 ${pathname === '/' && !activeTabParam ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navFeed')}</span>}
                </Link>

                <Link
                  href="/dashboard?tab=account_privacy"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/dashboard' && (activeTabParam === 'account_privacy' || activeTabParam === 'profile')
                      ? 'bg-blue-50 text-blue-950 font-black shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('tabPrivacyDpdp')}
                >
                  <Shield className={`w-4 h-4 shrink-0 ${pathname === '/dashboard' && (activeTabParam === 'account_privacy' || activeTabParam === 'profile') ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('tabPrivacyDpdp')}</span>}
                </Link>
              </>
            )}

            {/* 3. CITIZEN NAVIGATION */}
            {user && user.role !== 'admin' && user.role !== 'official' && user.role !== 'agency' && (
              <>
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

                <Link
                  href="/dashboard?tab=my_grievances"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/dashboard' && (activeTabParam === 'my_grievances' || activeTabParam === 'supported_issues' || !activeTabParam)
                      ? 'bg-orange-50 text-orange-900 shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('tabMyGrievances')}
                >
                  <FileText className={`w-4 h-4 shrink-0 ${pathname === '/dashboard' && (activeTabParam === 'my_grievances' || activeTabParam === 'supported_issues' || !activeTabParam) ? 'text-orange-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('tabMyGrievances')}</span>}
                </Link>

                <Link
                  href="/townhalls"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/townhalls') || (pathname === '/dashboard' && activeTabParam === 'townhall_activity')
                      ? 'bg-orange-50 text-orange-900 shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navTownhalls')}
                >
                  <Building className={`w-4 h-4 shrink-0 ${pathname.startsWith('/townhalls') || (pathname === '/dashboard' && activeTabParam === 'townhall_activity') ? 'text-orange-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navTownhalls')}</span>}
                </Link>

                <Link
                  href="/representatives"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/representatives') || (pathname === '/dashboard' && activeTabParam === 'my_representatives')
                      ? 'bg-orange-50 text-orange-900 shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('navRepresentatives')}
                >
                  <Users className={`w-4 h-4 shrink-0 ${pathname.startsWith('/representatives') || (pathname === '/dashboard' && activeTabParam === 'my_representatives') ? 'text-orange-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('navRepresentatives')}</span>}
                </Link>

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

                <Link
                  href="/dashboard?tab=account_privacy"
                  onClick={handleLinkClick}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/dashboard' && (activeTabParam === 'account_privacy' || activeTabParam === 'profile' || activeTabParam === 'notifications')
                      ? 'bg-orange-50 text-orange-900 shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={t('tabPrivacyDpdp')}
                >
                  <Shield className={`w-4 h-4 shrink-0 ${pathname === '/dashboard' && (activeTabParam === 'account_privacy' || activeTabParam === 'profile' || activeTabParam === 'notifications') ? 'text-orange-600' : 'text-gray-500'}`} />
                  {!isCollapsed && <span className="truncate">{t('tabPrivacyDpdp')}</span>}
                </Link>
              </>
            )}

            {/* 4. SIGNED-OUT VISITOR GATEWAY (Per user requirement: no app modules shown) */}
            {!user && (
              <div className="space-y-2 pt-1">
                {!isCollapsed ? (
                  <div className="p-3 bg-linear-to-b from-orange-50/90 to-amber-50/60 rounded-2xl border border-orange-200/80 space-y-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase">
                        <Sparkles className="w-3 h-3 text-orange-600" />
                        <span>RAISE Civic</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 mt-1">
                        {t('guestSidebarWelcome')}
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                        {t('guestSidebarSubtitle')}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {/* Sign In as Citizen */}
                      <Link
                        href="/sign-in"
                        onClick={handleLinkClick}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{t('signInCitizen')}</span>
                      </Link>

                      {/* Create Citizen Account */}
                      <Link
                        href="/sign-up"
                        onClick={handleLinkClick}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('createAccount')}</span>
                      </Link>

                      {/* Executive Office Portal */}
                      <Link
                        href="/office/sign-in"
                        onClick={handleLinkClick}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-semibold transition"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{t('officePortalLogin')}</span>
                      </Link>
                    </div>

                    {/* Learn About Platform / Marketing Site */}
                    <div className="pt-2 border-t border-orange-200/60">
                      <Link
                        href="/how-it-works"
                        onClick={handleLinkClick}
                        className="w-full flex items-center justify-between py-1 px-1.5 text-[11px] font-bold text-gray-600 hover:text-orange-600 transition"
                      >
                        <span>{t('marketingWebsite')}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Collapsed guest rail */
                  <div className="space-y-2 flex flex-col items-center">
                    <Link
                      href="/sign-in"
                      onClick={handleLinkClick}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition"
                      title={t('signInCitizen')}
                    >
                      <User className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={handleLinkClick}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition"
                      title={t('createAccount')}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/office/sign-in"
                      onClick={handleLinkClick}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition"
                      title={t('officePortalLogin')}
                    >
                      <Briefcase className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/how-it-works"
                      onClick={handleLinkClick}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition"
                      title={t('marketingWebsite')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECONDARY GROUP: TRANSPARENCY & AUDIT (For authenticated users) */}
          {user && (
            <div className="pt-3 border-t border-gray-100 space-y-0.5">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {t('transparencyAndAudit')}
                </div>
              )}

              {/* Transparency Ledger */}
              <Link
                href="/transparency"
                onClick={handleLinkClick}
                className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  pathname === '/transparency'
                    ? 'bg-orange-50 text-orange-900 shadow-2xs'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={t('navTransparency')}
              >
                <Wallet className={`w-4 h-4 shrink-0 ${pathname === '/transparency' ? 'text-orange-600' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="truncate">{t('navTransparency')}</span>}
              </Link>

              {/* Moderation Audit Logs */}
              <Link
                href="/transparency/moderation"
                onClick={handleLinkClick}
                className={`w-full flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  pathname === '/transparency/moderation'
                    ? 'bg-orange-50 text-orange-900 shadow-2xs'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={t('moderationLogs')}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${pathname === '/transparency/moderation' ? 'text-orange-600' : 'text-gray-400'}`} />
                {!isCollapsed && <span className="truncate">{t('moderationLogs')}</span>}
              </Link>
            </div>
          )}
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
