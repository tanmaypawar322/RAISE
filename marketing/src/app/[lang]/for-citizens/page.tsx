import React from 'react';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { appUrl } from '../../../lib/app-url';
import {
  Users,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  EyeOff,
  Flame,
  BadgeCheck,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function ForCitizensPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { forCitizens } = dict;

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
            {forCitizens.badge}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            {forCitizens.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {forCitizens.subtitle}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {forCitizens.features.map((feat, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs mb-3">
                  0{index + 1}
                </div>
                <h2 className="font-bold text-base text-gray-900 mb-2">
                  {feat.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* The 3 Guarantees: Cost, Privacy, Moderation */}
        <div className="space-y-6 mb-16">
          {/* Cost Guarantee */}
          <div className="p-6 sm:p-8 rounded-3xl bg-orange-50/60 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <BadgeCheck className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {forCitizens.costTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {forCitizens.costDesc}
            </p>
          </div>

          {/* Privacy Guarantee */}
          <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/50 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-blue-900" />
              <h2 className="text-xl font-bold text-gray-900">
                {forCitizens.privacyTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {forCitizens.privacyDesc}
            </p>
          </div>

          {/* Moderation Guarantee */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {forCitizens.moderationTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {forCitizens.moderationDesc}
            </p>
          </div>
        </div>

        {/* Final CTA Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gray-900 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            {forCitizens.ctaTitle}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto mb-6">
            {forCitizens.ctaDesc}
          </p>
          <a
            href={appUrl('/sign-up', lang as Language)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            <span>{forCitizens.ctaButton}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="mt-4 text-xs text-gray-500">
            {dict.hero.ctaTrustNotice}
          </p>
        </div>
      </div>
    </div>
  );
}
