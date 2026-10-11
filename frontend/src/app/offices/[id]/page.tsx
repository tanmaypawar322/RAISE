'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  FileText,
  TrendingUp,
  Scale,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

function OfficeScorecardContent() {
  const params = useParams();
  const id = params?.id as string;
  const { t, language } = useLanguage();
  const { user, token } = useAuth();

  const [office, setOffice] = useState<any>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [metricSnapshot, setMetricSnapshot] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction request modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [itemOrMetric, setItemOrMetric] = useState('');
  const [correctionExplanation, setCorrectionExplanation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [correctionNotice, setCorrectionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchOffice = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/${id}`,
          { headers }
        );
        const data = await res.json();
        setLoading(false);
        if (data.success && data.office) {
          setOffice(data.office);
          setScorecard(data.scorecard);
          setMetricSnapshot(data.metricSnapshot);
          setReports(data.reports || []);
        } else {
          setError(data.message || 'Office not found');
        }
      } catch (err) {
        setLoading(false);
        setError('Failed to load office scorecard data');
      }
    };
    fetchOffice();
  }, [id, token]);

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemOrMetric.trim() || correctionExplanation.trim().length < 10 || !contactEmail.includes('@')) {
      return;
    }
    setIsSubmittingCorrection(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/${id}/correct`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            itemOrMetric,
            explanation: correctionExplanation,
            contactEmail,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setShowCorrectionModal(false);
        setItemOrMetric('');
        setCorrectionExplanation('');
        setContactEmail('');
        setCorrectionNotice('Correction request submitted for administrative audit.');
      } else {
        alert(json.message || 'Error submitting correction.');
      }
    } catch {
      alert('Network error submitting correction request.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading Office Performance Record...</p>
        </main>
      </div>
    );
  }

  if (error || !office) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Office Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Unable to retrieve office record.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Grievances Feed</span>
          </Link>
        </main>
      </div>
    );
  }

  const isSampleTooSmall = scorecard?.isSampleTooSmall ?? (scorecard?.totalIssuesReceived < 10);
  const sampleSize = scorecard?.totalIssuesReceived ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Grievances</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Request a Correction</span>
            </button>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Methodology</span>
            </Link>
          </div>
        </div>

        {correctionNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <span>{correctionNotice}</span>
            <button onClick={() => setCorrectionNotice(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

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
                    {office.claimStatus === 'claimed' ? 'Official Claimed ✓' : 'Unclaimed Office'}
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
                href="/office-portal"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Officer Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scorecard KPI Grid */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Public Civic Performance Scorecard</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory accountability and SLA adherence metrics. Issues rerouted within 48h are excluded.
              </p>
            </div>
            {metricSnapshot?.computedAtFormatted && (
              <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                {metricSnapshot.computedAtFormatted}
              </span>
            )}
          </div>

          {/* Small Sample Warning if sample size < 10 */}
          {isSampleTooSmall && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Sample too small ({sampleSize}/10) to compute fair scores.</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Platform fairness rules suppress statistical percentages until at least 10 civic issues have been handled.
                </p>
              </div>
            </div>
          )}

          {scorecard && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Total Issues */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Issues Received
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {scorecard.totalIssuesReceived}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">all assigned grievances</span>
              </div>

              {/* % Acknowledged On Time */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Acknowledged On Time
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    isSampleTooSmall
                      ? 'text-slate-500'
                      : scorecard.percentAcknowledgedOnTime >= 75
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {isSampleTooSmall ? '—' : `${scorecard.percentAcknowledgedOnTime}%`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isSampleTooSmall ? 'sample < 10' : 'before SLA expiration'}
                </span>
              </div>

              {/* % Resolved */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Resolution Rate
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    isSampleTooSmall
                      ? 'text-slate-500'
                      : scorecard.percentResolved >= 60
                      ? 'text-emerald-700'
                      : 'text-slate-800'
                  }`}
                >
                  {isSampleTooSmall ? '—' : `${scorecard.percentResolved}%`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isSampleTooSmall ? 'sample < 10' : 'with verified proof'}
                </span>
              </div>

              {/* Median Resolution Days */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Median Resolution Time
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {isSampleTooSmall ? '—' : scorecard.medianResolutionDays}{' '}
                  {!isSampleTooSmall && <span className="text-xs font-semibold text-slate-500">days</span>}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isSampleTooSmall ? 'sample < 10' : 'filing to completion'}
                </span>
              </div>

              {/* Open Issues Count */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Active Backlog
                </span>
                <span className="text-2xl sm:text-3xl font-black text-blue-700">
                  {scorecard.openIssuesCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">open or in progress</span>
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
                <span className="text-[10px] text-slate-400 block mt-1">exceeded SLA clock</span>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Reports Archive */}
        {reports.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Published Monthly Reports Archive
            </h3>
            <div className="space-y-2">
              {reports.map((report: any) => (
                <div
                  key={report._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Report: {report.month}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Issues received: {report.metrics?.issuesReceived || 0} • Acknowledged SLA: {report.metrics?.acknowledgedPct || 0}%
                    </p>
                  </div>
                  <Link
                    href={`/reports/${office._id}/${report.month}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>View Report</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Submit a Correction Request for this Office
            </h3>
            <p className="text-xs text-slate-600">
              Any citizen, official, or agency can request a factual audit if an SLA calculation or grievance count appears inaccurate. Platform administrators review and recompute if an error is verified.
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Metric or Item Being Questioned *
                </label>
                <input
                  type="text"
                  required
                  value={itemOrMetric}
                  onChange={(e) => setItemOrMetric(e.target.value)}
                  placeholder="e.g. Overdue count or SLA adherence %"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Factual Explanation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={correctionExplanation}
                  onChange={(e) => setCorrectionExplanation(e.target.value)}
                  placeholder="Please state the discrepancy and supporting documentation or reference..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection || correctionExplanation.length < 10}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmittingCorrection ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OfficeScorecardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OfficeScorecardContent />
    </Suspense>
  );
}
