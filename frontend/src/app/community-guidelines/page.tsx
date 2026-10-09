'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';
import { Users, ArrowLeft, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  const { language } = useLanguage();

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
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {language === 'mr'
                  ? 'नागरी सहभाग व समुदाय मार्गदर्शक तत्त्वे'
                  : language === 'hi'
                  ? 'नागरिक सहभाग एवं समुदाय दिशानिर्देश'
                  : 'Civic Community Guidelines'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Rules of engagement ensuring objective, transparent, and non-partisan civic accountability.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6 text-xs text-gray-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              1. Platform Purpose & Focus
            </h2>
            <p>
              RAISE is dedicated strictly to municipal problem-solving: roads, water supply, drainage, garbage, public lighting, and civic infrastructure. It is not a forum for political debates, party campaigning, or religious disputes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. What Belongs on RAISE (Encouraged)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Clear Photographic or Voice Proof:</strong> Authentic photos showing the civic issue at the exact GPS location.</li>
              <li><strong>Constructive Descriptions:</strong> Objective descriptions detailing duration, safety hazards, and impact on residents.</li>
              <li><strong>Target Administrative Offices:</strong> Direct complaints to responsible departments (e.g. PCMC Water Supply Division, Ward 12 Office), not individuals.</li>
              <li><strong>Community Verification:</strong> Support genuine grievances filed by neighbors with one raise per person.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              3. What is Strictly Prohibited (Immediate Removal & Ban)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Doxxing & Personal Attacks:</strong> Posting residential addresses, private phone numbers, or personal abuse against officials or citizens.</li>
              <li><strong>Political or Communal Incitement:</strong> Defaming political parties or inciting communal/religious disharmony.</li>
              <li><strong>Fraudulent & AI-Generated Images:</strong> Uploading fabricated images or photos taken at unrelated locations.</li>
              <li><strong>Spam & Coordinated Manipulation:</strong> Creating duplicate accounts to artificially inflate raise counts.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-gray-900">4. Moderation & Appeals Process</h2>
            <p>
              Reports are screened by automated trilingual filters and community moderators. If your content is held or removed, you will receive a notification with the reason and you are permitted <strong>one appeal</strong> to submit clarifying evidence.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-gray-400 text-[11px]">
            <span>Version: 2026.1</span>
            <Link href="/terms" className="text-orange-600 hover:underline font-semibold">
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
