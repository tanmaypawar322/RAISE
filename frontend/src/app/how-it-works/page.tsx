'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';
import { HelpCircle, ArrowLeft, Camera, Users, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

export default function HowItWorksPage() {
  const { language } = useLanguage();

  const steps = [
    {
      num: '1',
      title: 'Report (६० सेकंदात नोंदवा)',
      desc: 'Capture a photo or 60-second voice note at the civic problem site. The platform auto-detects GPS coordinates and suggests the responsible municipal ward office.',
      icon: Camera,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      num: '2',
      title: 'Amplify (नागरी पाठिंबा)',
      desc: 'Other residents in your ward see the issue on the live map and click "Raise" to support it. One person, one raise — zero paid promotions or bot amplification.',
      icon: Users,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      num: '3',
      title: 'Inform & SLA Clock (कार्यालय उत्तरदायित्व)',
      desc: 'The responsible municipal office (e.g. PCMC Water Supply Division) receives the grievance on their official portal with an active countdown timer (24h to 72h SLA).',
      icon: Clock,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      num: '4',
      title: 'Solve & Proof (कामाची खात्री)',
      desc: 'Officials can only mark an issue resolved by attaching an "after-work" photograph within 150m of the site and a work completion note. Residents have a 7-day confirmation window.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      num: '5',
      title: 'Escalate (आपोआप शिडी चढणे)',
      desc: 'If an office fails to act before the SLA deadline, the grievance escalates automatically to the Central HQ / Commissioner office and generates pre-filled CPGRAMS & RTI draft applications.',
      icon: TrendingUp,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {language === 'mr'
                  ? 'RAISE कसे कार्य करते?'
                  : language === 'hi'
                  ? 'RAISE कैसे काम करता है?'
                  : 'How RAISE Works'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                The 5-stage lifecycle turning citizen grievances into verified public civic solutions.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${step.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Step {step.num}</span>
                    <h2 className="text-sm font-bold text-gray-900">{step.title}</h2>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 text-center">
          <h3 className="text-sm font-bold text-orange-950 mb-1">Ready to report a civic issue in your ward?</h3>
          <p className="text-xs text-orange-800 mb-3">Join your neighbors in Ward 12 (Nigdi - Pradhikaran).</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Open Live Civic Feed
          </Link>
        </div>
      </main>
    </div>
  );
}
