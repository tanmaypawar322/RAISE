'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../lib/translations';
import {
  FileText,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayoutContent({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language, setLanguage, t } = useLanguage();

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3001';

  // Determine active track from path
  const isOfficeTrack = pathname.startsWith('/office');
  const nextParam = searchParams.get('next');
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';

  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  // 5 RAISE Pillars
  const pillars = [
    { key: 'reportWord', step: '01' },
    { key: 'amplifyWord', step: '02' },
    { key: 'informWord', step: '03' },
    { key: 'solveWord', step: '04' },
    { key: 'escalateWord', step: '05' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans">
      {/* ========================================================
          LEFT BRAND PANEL (Desktop >= 1024px: ~45% width)
          ======================================================== */}
      <aside className="w-full lg:w-[45%] bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 text-white p-6 sm:p-8 lg:p-12 flex flex-col justify-between shrink-0 relative overflow-hidden">
        {/* Subtle decorative SVG background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="160" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="200" cy="200" r="110" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="200" r="60" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Top: Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-orange-600 font-black text-2xl flex items-center justify-center shadow-lg shadow-black/10">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-white">
                  RAISE
                </span>
                <span className="text-[10px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full border border-white/30 tracking-wider">
                  CIVIC PLATFORM
                </span>
              </div>
              <p className="text-xs text-orange-100/90 font-medium tracking-tight">
                Every Citizen’s Voice. Every Authority’s Duty.
              </p>
            </div>
          </div>

          {/* Tagline & 5 Pillars sequence */}
          <div className="mt-8 hidden lg:block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-orange-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Report • Amplify • Inform • Solve • Escalate</span>
            </div>

            {/* Pillar Step Sequence */}
            <div className="grid grid-cols-1 gap-2.5 my-6 max-w-sm">
              {pillars.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-white"
                >
                  <span className="font-mono text-[10px] font-bold text-amber-300 bg-black/20 px-1.5 py-0.5 rounded">
                    {p.step}
                  </span>
                  <span className="font-bold text-white tracking-wide">
                    {t(p.key as any)}
                  </span>
                </div>
              ))}
            </div>

            {/* Core Brand Value Statements (Verified from Marketing Site) */}
            <div className="space-y-4 pt-4 border-t border-white/15 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {t('brandValue1Title')}
                  </h4>
                  <p className="text-[11px] text-orange-100/80 leading-relaxed mt-0.5">
                    {t('brandValue1Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {t('brandValue2Title')}
                  </h4>
                  <p className="text-[11px] text-orange-100/80 leading-relaxed mt-0.5">
                    {t('brandValue2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {t('brandValue3Title')}
                  </h4>
                  <p className="text-[11px] text-orange-100/80 leading-relaxed mt-0.5">
                    {t('brandValue3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Learn more link to Marketing site */}
        <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex items-center justify-between">
          <a
            href={marketingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-200 transition underline underline-offset-4"
          >
            <span>{t('learnMoreAboutRaise')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <span className="text-[10px] text-orange-200 font-mono">v1.0 Production</span>
        </div>
      </aside>

      {/* ========================================================
          RIGHT FORM PANEL (Form, Role Switcher, Language Switcher)
          ======================================================== */}
      <main className="flex-1 bg-white p-4 sm:p-8 lg:p-12 flex flex-col justify-between min-h-screen overflow-x-hidden">
        {/* Top Header Row: Role Switch & Language Switcher */}
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {isOfficeTrack ? t('officeRoleTab') : t('citizenRoleTab')}
            </span>

            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`min-h-[36px] px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer select-none ${
                    language === l.code
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                  aria-label={`Switch to ${l.label}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Segmented Control Role Switcher */}
          <div className="bg-gray-100 p-1 rounded-2xl flex mb-2" role="tablist">
            <Link
              href={`/sign-in${nextQuery}`}
              role="tab"
              aria-selected={!isOfficeTrack}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition text-center min-h-[44px] cursor-pointer ${
                !isOfficeTrack
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{t('citizenRoleTab')}</span>
            </Link>

            <Link
              href={`/office/sign-in${nextQuery}`}
              role="tab"
              aria-selected={isOfficeTrack}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition text-center min-h-[44px] cursor-pointer ${
                isOfficeTrack
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{t('officeRoleTab')}</span>
            </Link>
          </div>

          {/* One-sentence context line */}
          <p className="text-[11px] text-gray-500 px-1 text-center font-medium">
            {isOfficeTrack ? t('officeRoleDesc') : t('citizenRoleDesc')}
          </p>
        </div>

        {/* Central Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {children}
        </div>

        {/* Bottom Legal Footer */}
        <footer className="w-full max-w-md mx-auto pt-6 mt-6 border-t border-gray-100 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-gray-900 transition underline underline-offset-2">
              {t('termsOfService')}
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link href="/privacy" className="hover:text-gray-900 transition underline underline-offset-2">
              {t('privacyPolicy')}
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link href="/community-guidelines" className="hover:text-gray-900 transition underline underline-offset-2">
              {t('communityGuidelines')}
            </Link>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            RAISE Civic Trust Foundation &bull; DPDP Act 2023 Compliant
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  );
}
