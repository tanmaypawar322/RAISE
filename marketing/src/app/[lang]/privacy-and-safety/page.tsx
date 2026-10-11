import React from 'react';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { Claim } from '../../../components/Claim';
import { appUrl } from '../../../lib/app-url';
import {
  Shield,
  Lock,
  EyeOff,
  Trash2,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { privacy } = dict;

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-950 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>{privacy.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            {privacy.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {privacy.subtitle}
          </p>
        </div>

        {/* What We Collect vs What is Never Public Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Collected */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg mb-4">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              <h2>{privacy.collectedTitle}</h2>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-700">
              {privacy.collectedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Never Public */}
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/50 border border-emerald-200">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg mb-4">
              <Lock className="w-5 h-5 text-emerald-600" />
              <h2>{privacy.neverPublicTitle}</h2>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-700">
              {privacy.neverPublicItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Architectural Protections */}
        <div className="space-y-6 mb-16">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-2xs">
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-orange-600" />
              <span>{privacy.exifTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {privacy.exifDesc}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-2xs">
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-orange-600" />
              <span>{privacy.deletionTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {privacy.deletionDesc}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-2xs">
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>{privacy.moderationTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {privacy.moderationDesc}
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-2xs">
            <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-orange-600" />
              <span>{privacy.adsTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {privacy.adsDesc}
            </p>
          </div>
        </div>

        {/* Claim-Gated Statutory Framework Notice */}
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed">
          <Claim
            id="dpdp_compliance"
            lang={lang as Language}
            fallback={
              <span>
                Our data protection procedures follow data minimization and user consent best practices. Formal statutory compliance notices will be published alongside live rollout.
              </span>
            }
          />
        </div>

        {/* Footer Link to Legal Pages in App */}
        <div className="mt-12 text-center text-xs text-gray-500">
          For full legal agreements, review our{' '}
          <a href={appUrl('/terms', lang as Language)} className="text-orange-600 font-bold hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href={appUrl('/privacy', lang as Language)} className="text-orange-600 font-bold hover:underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
