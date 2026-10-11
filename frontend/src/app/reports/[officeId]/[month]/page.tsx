'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../../components/Header';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import {
  Printer,
  ChevronLeft,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Heart,
  Scale,
  AlertTriangle,
  FileText,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

function OfficeReportContent() {
  const params = useParams();
  const officeId = params?.officeId as string;
  const month = params?.month as string;
  const { t, language } = useLanguage();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!officeId || !month) return;
    const fetchReport = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/office/${officeId}/${month}`,
          { headers }
        );
        const json = await res.json();
        setLoading(false);
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Report not found.');
        }
      } catch {
        setLoading(false);
        setError('Failed to load office monthly report.');
      }
    };
    fetchReport();
  }, [officeId, month, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading monthly departmental report...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-2">Report Not Available</h2>
          <p className="text-xs text-slate-600 mb-6">{error || 'This report is unavailable or still under review.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Feed</span>
          </Link>
        </main>
      </div>
    );
  }

  const { report, office } = data;
  const metrics = report.metricsSnapshot || {};
  const isSampleTooSmall = metrics.isSampleTooSmall;
  const isDraft = report.status === 'draft_reply_window';

  const localizedOfficeName =
    language === 'mr' && office.nameMr
      ? office.nameMr
      : language === 'hi' && office.nameHi
      ? office.nameHi
      : office.name;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 print:bg-white print:pb-0">
      {/* Header hidden during print */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:px-0 print:py-2">
        {/* Navigation & Print Action */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={`/offices/${office._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Office Scorecard</span>
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>

        {/* Draft Notice Banner */}
        {isDraft && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium space-y-1 print:border-amber-400">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Right-of-Reply Review Window Active</span>
            </div>
            <p>
              This draft report is currently open for formal departmental reply until{' '}
              <strong>{new Date(report.replyDeadline).toLocaleDateString()}</strong>. It will publish automatically
              on the public record once concluded.
            </p>
          </div>
        )}

        {/* Official Report Document Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Monthly Public Administration Record
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  Department Performance & Resolution Report
                </h1>
                <p className="text-sm font-bold text-slate-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Reporting Period: {report.period}</span>
                </p>
              </div>

              {/* Verified Platform Seal */}
              <div className="flex sm:flex-col items-center sm:items-end gap-1 text-slate-500 text-right">
                <span className="text-xs font-black tracking-wider text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>RAISE Civic Platform</span>
                </span>
                <span className="text-[10px] text-slate-400">Audited Resolution Tracking</span>
              </div>
            </div>

            {/* Office Identity Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{localizedOfficeName}</h3>
                  <p className="text-xs text-slate-600">
                    <span className="font-bold uppercase">{office.department || 'Civil Administration'}</span> &bull;{' '}
                    <span>{office.jurisdiction?.name || 'Local Jurisdiction'}</span>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full uppercase">
                  {office.level || 'Department'}
                </span>
              </div>
            </div>
          </div>

          {/* Sample Size Safeguard Warning */}
          {isSampleTooSmall && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <strong className="block font-bold">Rule 5 Fairness Safeguard:</strong>
              <span>
                Fewer than 10 grievances were received in this period (sample size: {metrics.sampleSize || 0}).
                Percentage scores and rate metrics are suppressed to ensure statistical fairness.
              </span>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department Performance Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Total Grievances Received</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {metrics.totalIssuesReceived ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Routed to this office</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Confirmed Resolutions</span>
                <span className="text-xl font-black text-emerald-700 mt-1 block">
                  {metrics.confirmedResolvedCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Citizen confirmed with proof</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Citizen Thanks</span>
                <span className="text-xl font-black text-rose-600 mt-1 block">
                  {metrics.citizenThanksCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Registered appreciation</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">SLA Compliance Rate</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {isSampleTooSmall || metrics.slaComplianceRate === null
                    ? '—'
                    : `${metrics.slaComplianceRate}%`}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {isSampleTooSmall ? 'Sample < 10' : 'Resolved within SLA clock'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Median Resolution Time</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {isSampleTooSmall || metrics.medianResolutionHours === null
                    ? '—'
                    : `${metrics.medianResolutionHours}h`}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {isSampleTooSmall ? 'Sample < 10' : 'From receipt to resolution'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Audit & Methodology</span>
                <Link
                  href="/methodology"
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 mt-2 block"
                >
                  View Rules & Formulas &rarr;
                </Link>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Trilingual published standard</span>
              </div>
            </div>
          </div>

          {/* Top 3 Categories */}
          {metrics.top3Categories?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Top Categories Handled
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {metrics.top3Categories.map((c: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 capitalize">{c.category}</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      {c.count} issues
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Formal Right of Reply */}
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-700" />
                <span>Formal Right of Reply (Department Statement)</span>
              </h3>
              {report.replySubmittedAt && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Submitted {new Date(report.replySubmittedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
              {report.replyText ? (
                <p className="whitespace-pre-wrap">{report.replyText}</p>
              ) : (
                <p className="italic text-slate-400">No formal reply submitted by the office.</p>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: Right of reply statements are submitted by authorized department officials before publication.
              They provide operational context but do not alter independently computed outcome figures.
            </p>
          </div>

          {/* Signoff Footer */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <span>Report Generated: {new Date(report.createdAt).toLocaleString()}</span>
            <span>Platform Standard: Section 8 Neutrality & Verified Accountability</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OfficeReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OfficeReportContent />
    </Suspense>
  );
}
