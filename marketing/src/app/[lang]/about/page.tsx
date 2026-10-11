import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { Claim } from '../../../components/Claim';
import { appUrl } from '../../../lib/app-url';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function AboutPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { about } = dict;

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-950 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-orange-200">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>{about.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            {about.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {about.subtitle}
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-12 p-8 rounded-3xl bg-gray-50 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {about.missionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {about.missionDesc}
          </p>
        </div>

        {/* Operational Independence & Non-Partisanship */}
        <div className="mb-12 p-8 rounded-3xl bg-white border border-gray-200 shadow-2xs">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {about.howWeRunTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4">
            {about.howWeRunDesc}
          </p>

          {/* Gated Claim for Section 8 & Registration */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed">
            <Claim
              id="section8_registration"
              lang={lang as Language}
              fallback={
                <span>
                  RAISE operates as an independent civic technology platform. Our organizational and registration structure will be formally updated upon municipal trial rollout.
                </span>
              }
            />
          </div>
        </div>

        {/* Funding & Sustainability */}
        <div className="mb-12 p-8 rounded-3xl bg-white border border-gray-200 shadow-2xs">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            {about.fundingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4">
            {about.fundingDesc}
          </p>

          {/* Gated Claim for Funding Model */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed">
            <Claim
              id="funding_model_no_party_funds"
              lang={lang as Language}
              fallback={
                <span>
                  We maintain a strict non-partisan red line: we will publish audited funding and expenditure records as part of our public transparency reports.
                </span>
              }
            />
          </div>
        </div>

        {/* Operational Charter List */}
        <div className="mb-16 p-8 rounded-3xl bg-orange-50/60 border border-orange-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {about.charterTitle}
          </h2>
          <ul className="space-y-3">
            {about.charterItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-800">
                <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href={`/${lang}/contact`}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            <span>Contact Our Team</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
