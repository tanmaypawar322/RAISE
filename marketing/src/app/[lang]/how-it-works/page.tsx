import React from 'react';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { appUrl } from '../../../lib/app-url';
import {
  Camera,
  ThumbsUp,
  Building2,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function HowItWorksPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { howItWorks } = dict;

  const stepIcons = [
    <Camera key="0" className="w-6 h-6 text-orange-600" />,
    <ThumbsUp key="1" className="w-6 h-6 text-orange-600" />,
    <Building2 key="2" className="w-6 h-6 text-orange-600" />,
    <Clock key="3" className="w-6 h-6 text-orange-600" />,
    <ShieldAlert key="4" className="w-6 h-6 text-orange-600" />,
  ];

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
            {howItWorks.title}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            How RAISE Works
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {howItWorks.subtitle}
          </p>
        </div>

        {/* The 5 Steps Breakdown */}
        <div className="space-y-8">
          {howItWorks.steps.map((step, idx) => (
            <div
              key={step.letter}
              className="p-6 sm:p-8 rounded-3xl border border-gray-200 bg-gray-50/50 shadow-xs flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-xs">
                {step.letter}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    Step 0{idx + 1} &bull; {step.word}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Specific detail pill per step */}
                {idx === 0 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                    <strong>Ground Evidence:</strong> Supports camera capture, location GPS tagging, and 60-second voice notes in Marathi or Hindi. EXIF metadata is scrubbed automatically.
                  </div>
                )}
                {idx === 1 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                    <strong>1-Person 1-Raise:</strong> Each user can support a grievance once. Ranking prioritizes genuine neighborhood urgency without bots or paid promotion.
                  </div>
                )}
                {idx === 2 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                    <strong>SLA Response Clock:</strong> Categorized by municipal service norms (Roads, Water, Sanitation, Health, Electricity) with statutory response deadlines.
                  </div>
                )}
                {idx === 3 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                    <strong>The Definition of "Resolved":</strong> An issue is NEVER closed simply because an office claims so. Resolution strictly requires official after-photos and a 7-day citizen confirmation window.
                  </div>
                )}
                {idx === 4 && (
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-700">
                    <strong>Statutory Escalations:</strong> If the clock breaches, the issue escalates to senior supervisory bodies. Citizens receive pre-filled legal drafts for CPGRAMS and RTI with one tap.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resolved Deep Dive Box */}
        <div className="mt-16 p-8 rounded-3xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">
              Proof-Backed Resolution: The Gold Standard
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4">
            In many conventional complaint portals, issues are closed prematurely with generic remarks like "work completed" without ground evidence. RAISE changes this entirely:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-700 list-disc list-inside">
            <li>Officers must upload mandatory photographic proof of the finished repair.</li>
            <li>GPS distance between original grievance and resolution photo must match within 150 meters.</li>
            <li>Local citizens have a 7-day window to confirm or dispute incomplete work.</li>
            <li>Disputed grievances automatically reopen and reset the SLA response clock.</li>
          </ul>
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <a
            href={appUrl('/sign-up', lang as Language)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            <span>{dict.hero.primaryCta}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
