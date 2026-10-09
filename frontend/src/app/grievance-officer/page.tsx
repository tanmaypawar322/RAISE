'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldAlert, ArrowLeft, Mail, Phone, MapPin, Clock, Award } from 'lucide-react';

export default function GrievanceOfficerPage() {
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
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {language === 'mr'
                  ? 'तक्रार निवारण अधिकारी (Grievance Officer)'
                  : language === 'hi'
                  ? 'शिकायत निवारण अधिकारी (Grievance Officer)'
                  : 'Designated Grievance Officer'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Statutory disclosure under IT Rules 2021 & Digital Personal Data Protection Act 2023.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6 text-xs text-gray-700 leading-relaxed">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-xs mb-0.5">Statutory Response SLA Guarantee</h3>
              <p className="text-[11px] leading-relaxed">
                Acknowledgment within <strong>24 hours</strong>. Formal resolution and investigation disposal within <strong>15 days</strong> of receipt.
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              Officer Contact Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Designated Officer</div>
                  <div className="font-bold text-gray-900 text-xs">Adv. Radhika Deshmukh</div>
                  <div className="text-[11px] text-gray-500">Legal Counsel & Grievance Redressal Lead</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Official Grievance Email</div>
                  <a href="mailto:grievance@raise.org" className="font-bold text-orange-600 hover:underline text-xs">
                    grievance@raise.org
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Direct Helpline</div>
                  <div className="font-bold text-gray-900 text-xs">+91 20 2742 5555 (Mon–Fri, 10:00 to 18:00 IST)</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Jurisdiction & Office Address</div>
                  <div className="font-bold text-gray-900 text-xs">RAISE Civic Foundation</div>
                  <div className="text-[11px] text-gray-500">Sector 24, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune, Maharashtra 411044</div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2 pt-2 border-t border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">How to File a Content or Privacy Complaint</h2>
            <p>
              Citizens may file a formal complaint regarding defamatory content, privacy violations, or incorrect grievance classifications directly via our <Link href="/report-content" className="text-orange-600 hover:underline font-semibold">Takedown Request Form</Link> or by sending an email with the relevant Issue URL and grounds for objection.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
