'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronLeft,
  FileText,
  MapPin,
  TrendingUp,
} from 'lucide-react';

interface ScorecardData {
  totalIssuesReceived: number;
  percentAcknowledgedOnTime: number;
  percentResolved: number;
  medianResolutionDays: number;
  openIssuesCount: number;
  overdueCount: number;
  methodology: {
    title: string;
    explanation: string;
  };
}

interface OfficeData {
  _id: string;
  name: string;
  nameMr?: string;
  department: string;
  level: string;
  claimStatus: string;
  officialEmail?: string;
}

function OfficeScorecardContent() {
  const params = useParams();
  const id = params?.id as string;
  const { t, language } = useLanguage();

  const [office, setOffice] = useState<OfficeData | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success && data.office) {
          setOffice(data.office);
          setScorecard(data.scorecard);
        } else {
          setError(data.message || 'Office not found');
        }
      })
      .catch((err) => {
        setLoading(false);
        setError('Failed to load office scorecard data');
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Grievances</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 animate-pulse">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-500">Loading Office Scorecard...</p>
          </div>
        ) : error || !office ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-red-200">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800 mb-1">Office Not Found</h2>
            <p className="text-xs text-slate-500 mb-4">{error || 'Unable to retrieve office record.'}</p>
            <Link
              href="/"
              className="inline-flex px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Office Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {office.level} Level
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                          office.claimStatus === 'claimed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {office.claimStatus === 'claimed' ? 'Official Claimed' : 'Unclaimed Office'}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {language === 'mr' && office.nameMr ? office.nameMr : office.name}
                    </h1>
                    {office.nameMr && language !== 'mr' && (
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{office.nameMr}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      Department: <span className="font-semibold text-slate-700">{office.department}</span>
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <Link
                    href={`/office-portal`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Officer Portal</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Scorecard KPI Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span>Public Civic Performance Scorecard</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live accountability and SLA adherence metrics for this public office.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  v1 Standard
                </span>
              </div>

              {scorecard && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {/* Total Issues */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Total Issues Received
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {scorecard.totalIssuesReceived}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">all routed grievances</span>
                  </div>

                  {/* % Acknowledged On Time */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Acknowledged On Time
                    </span>
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        scorecard.percentAcknowledgedOnTime >= 75
                          ? 'text-emerald-700'
                          : scorecard.percentAcknowledgedOnTime >= 50
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {scorecard.percentAcknowledgedOnTime}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">before SLA expiration</span>
                  </div>

                  {/* % Resolved */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Resolution Rate
                    </span>
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        scorecard.percentResolved >= 60 ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {scorecard.percentResolved}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">with proof of work</span>
                  </div>

                  {/* Median Resolution Days */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Median Resolution Days
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {scorecard.medianResolutionDays}{' '}
                      <span className="text-xs font-semibold text-slate-500">days</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">filing to proof</span>
                  </div>

                  {/* Open Issues Count */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Open Active Issues
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-blue-700">
                      {scorecard.openIssuesCount}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">in progress backlog</span>
                  </div>

                  {/* Overdue Count */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                      Overdue / Breached
                    </span>
                    <span
                      className={`text-2xl sm:text-3xl font-black ${
                        scorecard.overdueCount > 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {scorecard.overdueCount}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">past SLA target</span>
                  </div>
                </div>
              )}

              {/* Explainer / Methodology Notice */}
              {scorecard?.methodology && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 mb-0.5">
                      {scorecard.methodology.title}
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      {scorecard.methodology.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OfficeScorecardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="animate-pulse text-slate-500 font-bold text-xs">
            Loading Office Scorecard...
          </div>
        </div>
      }
    >
      <OfficeScorecardContent />
    </Suspense>
  );
}
