import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../content/i18n';
import { appUrl } from '../../lib/app-url';
import { Accordion } from '../../components/Accordion';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Eye,
  Users,
  Building2,
  Lock,
  Scale,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  PhoneCall,
  Flame,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { hero, howItWorks, splits, principles, screenshots, faq } = dict;

  // Icons mapping for principles
  const principleIcons = [
    <Scale key="0" className="w-6 h-6 text-orange-600 mb-3" />,
    <Building2 key="1" className="w-6 h-6 text-orange-600 mb-3" />,
    <Eye key="2" className="w-6 h-6 text-orange-600 mb-3" />,
    <Lock key="3" className="w-6 h-6 text-orange-600 mb-3" />,
    <Users key="4" className="w-6 h-6 text-orange-600 mb-3" />,
    <FileText key="5" className="w-6 h-6 text-orange-600 mb-3" />,
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ========================================================
          1. HERO SECTION
          ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-white py-16 sm:py-24 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-950 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border border-orange-200 shadow-2xs">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>{hero.badge}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.15] mb-6">
            {hero.title} <br />
            <span className="text-orange-600">{hero.highlight}</span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed mb-8">
            {hero.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={appUrl('/sign-up', lang as Language)}
              className="w-full sm:w-auto px-7 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>{hero.primaryCta}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={appUrl('/sign-in', lang as Language)}
              className="w-full sm:w-auto px-7 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition flex items-center justify-center"
            >
              {hero.secondaryCta}
            </a>
          </div>

          {/* Honest Privacy Notice near CTAs */}
          <p className="mt-4 text-xs text-gray-500 font-medium">
            {hero.ctaTrustNotice}
          </p>

          {/* Official/Agency Portal Helper Link */}
          <div className="mt-3 text-xs text-gray-500">
            {hero.officialHelperPrefix}{' '}
            <a
              href={appUrl('/office/request-access', lang as Language)}
              className="text-orange-600 font-bold hover:underline"
            >
              {hero.officialHelperLink}
            </a>{' '}
            {hero.officialHelperOr}{' '}
            <a
              href={appUrl('/office/sign-in', lang as Language)}
              className="text-gray-700 font-medium hover:underline"
            >
              {hero.officialHelperSignIn}
            </a>
          </div>

          {/* 4 Pillars Counter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto text-left">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-orange-600">{hero.trustPillars.freeTitle}</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">{hero.trustPillars.freeSub}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-gray-900">{hero.trustPillars.speedTitle}</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">{hero.trustPillars.speedSub}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-gray-900">{hero.trustPillars.policyTitle}</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">{hero.trustPillars.policySub}</div>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-emerald-600">{hero.trustPillars.neutralTitle}</div>
              <div className="text-xs font-semibold text-gray-900 mt-1">{hero.trustPillars.neutralSub}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. HOW IT WORKS 5-STAGE LIFECYCLE
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
              {howItWorks.title}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {hero.badge}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
              {howItWorks.subtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {howItWorks.steps.map((s) => (
              <div
                key={s.letter}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-lg mb-3">
                    {s.letter}
                  </div>
                  <div className="text-xs font-bold text-orange-600 uppercase tracking-tight mb-1">
                    {s.word}
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-2 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={`/${lang}/how-it-works`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              <span>{howItWorks.detailedCta}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. DUAL TRACK SPLIT: CITIZENS VS OFFICES
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Citizen Panel */}
            <div className="bg-orange-50/60 rounded-3xl p-6 sm:p-8 border border-orange-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold mb-4 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {splits.citizenTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  {splits.citizenDesc}
                </p>
              </div>
              <Link
                href={`/${lang}/for-citizens`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                <span>{splits.citizenCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Office Panel */}
            <div className="bg-blue-50/50 rounded-3xl p-6 sm:p-8 border border-blue-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold mb-4 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {splits.officeTitle}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  {splits.officeDesc}
                </p>
              </div>
              <Link
                href={`/${lang}/for-offices`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-900 hover:text-blue-950"
              >
                <span>{splits.officeCta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. CORE PRINCIPLES CHARTER
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
              {principles.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {principles.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
              {principles.subtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.items.map((item, idx) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs"
              >
                {principleIcons[idx % principleIcons.length]}
                <h3 className="font-bold text-sm text-gray-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. SAMPLE SCREENSHOTS PREVIEW (LABELLED SAMPLE)
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
              {screenshots.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {screenshots.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {screenshots.subtitle}
            </p>
            {/* Non-negotiable Sample Label */}
            <div className="mt-3 inline-block px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px] font-bold tracking-wide">
              {screenshots.sampleDisclaimer}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-gray-200 rounded-xl mb-4 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-300">
                  <span>[SAMPLE REPORT SCREEN]</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">
                  {screenshots.screen1Title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {screenshots.screen1Desc}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-gray-200 rounded-xl mb-4 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-300">
                  <span>[SAMPLE FEED & MAP SCREEN]</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">
                  {screenshots.screen2Title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {screenshots.screen2Desc}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 flex flex-col justify-between">
              <div>
                <div className="aspect-video bg-gray-200 rounded-xl mb-4 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-300">
                  <span>[SAMPLE OFFICE QUEUE SCREEN]</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">
                  {screenshots.screen3Title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {screenshots.screen3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FAQ TEASER ACCORDION
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
              {faq.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              {faq.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {faq.subtitle}
            </p>
          </div>

          {/* Show top 4 FAQ items with link to full FAQ page */}
          <Accordion
            items={faq.items.slice(0, 4).map((item, idx) => ({
              id: `faq-teaser-${idx}`,
              question: item.question,
              answer: item.answer,
            }))}
          />

          <div className="mt-8 text-center">
            <Link
              href={`/${lang}/faq`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              <span>View all {faq.items.length} questions & answers →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. CLOSING CALL TO ACTION
          ======================================================== */}
      <section className="py-16 sm:py-20 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
            {dict.forCitizens.ctaTitle}
          </h2>
          <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto mb-8 leading-relaxed">
            {dict.forCitizens.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={appUrl('/sign-up', lang as Language)}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <span>{dict.forCitizens.ctaButton}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={appUrl('/office/request-access', lang as Language)}
              className="w-full sm:w-auto px-8 py-3.5 bg-orange-700 hover:bg-orange-800 text-white border border-orange-500 rounded-xl text-sm font-semibold transition flex items-center justify-center"
            >
              {dict.forOffices.ctaButton}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
