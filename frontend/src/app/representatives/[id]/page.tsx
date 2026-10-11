'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  UserCheck,
  Building2,
  Clock,
  Heart,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  FileText,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Scale,
  Send,
  HelpCircle,
} from 'lucide-react';

function RepresentativeRecordContent() {
  const params = useParams();
  const id = params?.id as string;
  const { t, language } = useLanguage();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'taken_up' | 'updates' | 'reports' | 'milestones'>('taken_up');
  const [milestones, setMilestones] = useState<any[]>([]);

  // Correction request modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [itemOrMetric, setItemOrMetric] = useState('');
  const [correctionExplanation, setCorrectionExplanation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [correctionNotice, setCorrectionNotice] = useState<string | null>(null);

  // Dispute modal & action feedback state
  const [disputeModalUpdateId, setDisputeModalUpdateId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchRep = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/${id}`,
          { headers }
        );
        const json = await res.json();
        setLoading(false);
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Representative not found.');
        }

        // Fetch verified milestone portfolios
        const milRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/${id}/milestones`,
          { headers }
        );
        const milJson = await milRes.json();
        if (milJson.success) {
          setMilestones(milJson.milestones || []);
        }
      } catch (err: any) {
        setLoading(false);
        setError('Failed to retrieve representative public record.');
      }
    };
    fetchRep();
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/${id}/correct`,
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
        setCorrectionNotice('Correction request registered for administrative audit review.');
      } else {
        alert(json.message || 'Error submitting correction.');
      }
    } catch {
      alert('Network error submitting correction request.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleConfirmUpdate = async (updateId: string) => {
    if (!user || !token) {
      alert('Please sign in to confirm this community update.');
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/updates/${updateId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({
          ...prev,
          updates: (prev.updates || []).map((u: any) =>
            u._id === updateId
              ? { ...u, confirmedCount: json.confirmedCount, disputedCount: json.disputedCount }
              : u
          ),
        }));
        setActionFeedback('Your confirmation has been registered.');
      } else {
        alert(json.message || 'Unable to confirm update.');
      }
    } catch {
      alert('Network error confirming update.');
    }
  };

  const handleDisputeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalUpdateId || disputeReason.trim().length < 20) {
      alert('Dispute explanation must be at least 20 characters.');
      return;
    }
    if (!user || !token) {
      alert('Please sign in to submit a dispute.');
      return;
    }
    setIsSubmittingDispute(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/updates/${disputeModalUpdateId}/dispute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: disputeReason.trim() }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({
          ...prev,
          updates: (prev.updates || []).map((u: any) =>
            u._id === disputeModalUpdateId
              ? {
                  ...u,
                  confirmedCount: json.confirmedCount,
                  disputedCount: json.disputedCount,
                  isUnderCommunityReview: json.isUnderCommunityReview,
                }
              : u
          ),
        }));
        setDisputeModalUpdateId(null);
        setDisputeReason('');
        setActionFeedback('Your dispute has been logged for community verification.');
      } else {
        alert(json.message || 'Unable to submit dispute.');
      }
    } catch {
      alert('Network error submitting dispute.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleVoteMilestone = async (milestoneId: string, vote: 'verify' | 'dispute', disputeReason?: string) => {
    if (!user || !token) {
      alert('Please sign in to audit and verify public development works.');
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/milestones/${milestoneId}/vote`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote, disputeReason }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setActionFeedback('Citizen audit vote recorded successfully.');
        setMilestones((prev) =>
          prev.map((m) => (m._id === milestoneId ? json.milestone : m))
        );
      } else {
        alert(json.message || 'Failed to record vote');
      }
    } catch {
      alert('Network error while recording milestone audit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading public representative record...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Record Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Unable to display public record.'}</p>
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

  const { profile, isClaimed, metricSnapshot, openIssuesCount, issuesTakenUp = [], updates = [], reports = [] } = data;
  const metrics = metricSnapshot?.metrics || {};
  const isSampleTooSmall = metricSnapshot?.isSampleTooSmall;

  // Unclaimed profile view
  if (!isClaimed || profile.status === 'unclaimed') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Grievances Feed</span>
          </Link>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <UserCheck className="w-8 h-8 text-slate-400" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {profile.role.toUpperCase().replace(/_/g, ' ')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {profile.displayName}
              </h1>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                {profile.titleText || profile.jurisdiction?.name || 'Constituency'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 max-w-md mx-auto text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Not Yet On RAISE</span>
              </div>
              <p className="text-xs text-amber-800">
                This public seat has <strong>{openIssuesCount || 0} open grievances</strong> in this constituency awaiting formal representation.
              </p>
            </div>

            {data?.electionFreeze?.isFrozen && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 max-w-md mx-auto text-left space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Model Code of Conduct in Effect</span>
                </div>
                <p className="text-xs text-amber-800">
                  Representative onboarding and activity are paused until{' '}
                  <strong>
                    {data.electionFreeze.freezeWindow?.freezeEnd
                      ? new Date(data.electionFreeze.freezeWindow.freezeEnd).toLocaleDateString()
                      : 'election conclusion'}
                  </strong>
                  {data.electionFreeze.freezeWindow?.reason && ` (${data.electionFreeze.freezeWindow.reason})`}.
                </p>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/office/request-access"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm"
              >
                Claim This Representative Office
              </Link>
              <Link
                href="/methodology"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                View Platform Rules
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Claimed & Verified Profile View
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
            <span>Back to Grievances Feed</span>
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

        {actionFeedback && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-blue-700 font-bold">✕</button>
          </div>
        )}

        {data?.electionFreeze?.isFrozen && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Model Code of Conduct in Effect: Activity Paused
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Representative activity and citizen requests are paused until{' '}
                <strong>
                  {data.electionFreeze.freezeWindow?.freezeEnd
                    ? new Date(data.electionFreeze.freezeWindow.freezeEnd).toLocaleDateString()
                    : 'the conclusion of the election cycle'}
                </strong>
                {data.electionFreeze.freezeWindow?.reason && ` (${data.electionFreeze.freezeWindow.reason})`}.
                Historical performance records remain available for public inspection.
              </p>
            </div>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {profile.role.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Verified on RAISE ✓
                  </span>
                  {profile.status === 'term_ended' && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Past Representative (Term Ended)
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {profile.displayName}
                </h1>

                <p className="text-xs text-slate-500 mt-0.5">
                  {profile.titleText || `${profile.role.toUpperCase()}, ${profile.jurisdiction?.name || 'Constituency'}`}
                </p>

                {profile.termStart && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Term: {new Date(profile.termStart).toLocaleDateString()} — {profile.termEnd ? new Date(profile.termEnd).toLocaleDateString() : 'Present'}
                  </p>
                )}
              </div>
            </div>

            {profile.officialSiteUrl && (
              <div className="sm:text-right shrink-0">
                <a
                  href={profile.officialSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
                >
                  <span>Official Public Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Public Credit & Accountability KPI Grid */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <span>Verified Public Credit & Accountability Record</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed exclusively from citizen-confirmed outcomes. Self-reported claims are excluded.
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
                <strong>Sample too small ({metricSnapshot?.sampleSize || 0}/10) to compute fair scores.</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Platform fairness rules suppress statistical percentages until at least 10 civic asks have been received. Only raw counts are displayed below.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Asks Received */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                Citizen Asks
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics.asksReceived ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">requests to look into issues</span>
            </div>

            {/* 72h Response Rate */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                72h Response SLA
              </span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600">
                {metrics.responseRatePct !== null && !isSampleTooSmall ? `${metrics.responseRatePct}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {isSampleTooSmall ? 'sample < 10' : 'answered within 72h'}
              </span>
            </div>

            {/* Confirmed Resolutions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                Confirmed Resolutions
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {metrics.confirmedResolutions ?? 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">citizen verified results</span>
            </div>

            {/* Citizen Thanks Count */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                Citizen Gratitude
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 flex items-center gap-1">
                <Heart className="w-5 h-5 fill-rose-600 text-rose-600 inline" />
                <span>{metrics.citizenThanksCount ?? 0}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">public thank-yous received</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('taken_up')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'taken_up'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Issues Taken Up ({issuesTakenUp.length})
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'updates'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Self-Reported Updates ({updates.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Monthly Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'milestones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Verified Milestones ({milestones.length})
          </button>
        </div>

        {/* Tab 1: Issues Taken Up */}
        {activeTab === 'taken_up' && (
          <div className="space-y-3">
            {issuesTakenUp.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                No issues taken up yet by this representative.
              </div>
            ) : (
              issuesTakenUp.map((issue: any) => (
                <div
                  key={issue._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {issue.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          issue.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.status.replace(/_/g, ' ')}
                      </span>
                      {issue.confirmedByCount > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {issue.confirmedByCount} citizens confirmed ✓
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {issue.title}
                    </h4>

                    <span className="text-[11px] text-slate-400 block">
                      Taken up on {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <Link
                    href={`/issues/${issue._id}/view`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0"
                  >
                    <span>View Grievance</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Self-Reported Updates */}
        {activeTab === 'updates' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
              <strong>Rule 2 Safeguard:</strong> All entries here are self-reported by the representative and pre-moderated for non-campaigning compliance. Citizens can confirm or dispute each entry.
            </div>

            {updates.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                No self-reported updates published.
              </div>
            ) : (
              updates.map((update: any) => (
                <div
                  key={update._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Self-Reported
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <span>👍 {update.confirmedCount || 0} confirms</span>
                      <span>•</span>
                      <span>👎 {update.disputedCount || 0} disputes</span>
                    </div>
                  </div>

                  {update.isUnderCommunityReview && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Under community review: multiple residents dispute this update</span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-slate-900">
                    {update.title}
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {update.body}
                  </p>

                  {update.photos?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {update.photos.map((p: string, idx: number) => (
                        <img
                          key={idx}
                          src={p}
                          alt="Update proof"
                          className="w-full h-36 object-cover rounded-xl border border-slate-200"
                        />
                      ))}
                    </div>
                  )}

                  {/* Citizen Cross-Check Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleConfirmUpdate(update._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Confirm this work ({update.confirmedCount || 0})</span>
                    </button>
                    <button
                      onClick={() => {
                        setDisputeModalUpdateId(update._id);
                        setDisputeReason('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Dispute this work ({update.disputedCount || 0})</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Monthly Reports Archive */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                No monthly governance reports published yet.
              </div>
            ) : (
              reports.map((report: any) => (
                <div
                  key={report._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Monthly Governance Report: {report.month}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Published
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Issues received: {report.metrics?.issuesReceived || 0} • Confirmed: {report.metrics?.confirmedCount || 0}
                    </p>
                  </div>

                  <Link
                    href={`/reports/rep/${id}/${report.month}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Verified Milestones */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
                No major scheme works or milestones published yet for this representative.
              </div>
            ) : (
              milestones.map((m: any) => {
                const totalVotes = (m.verifiedCount || 0) + (m.disputedCount || 0);
                const confirmRate = totalVotes > 0 ? Math.round((m.verifiedCount / totalVotes) * 100) : null;

                return (
                  <div
                    key={m._id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {m.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            m.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : m.status === 'disputed'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.status === 'verified'
                            ? 'Citizen Verified ✓'
                            : m.status === 'disputed'
                            ? 'Disputed by Citizens ✗'
                            : 'Community Audit Active'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        Sanctioned Budget:{' '}
                        <strong className="text-slate-900">
                          ₹{((m.budgetPaise || 0) / 100).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {m.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {m.description}
                    </p>

                    {m.sanctionOrderNumber && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        Sanction Order No: <strong>{m.sanctionOrderNumber}</strong> • Completed on{' '}
                        {new Date(m.completionDate).toLocaleDateString()}
                      </div>
                    )}

                    {/* Community Confirmation Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">
                          {m.verifiedCount || 0} Citizens Verified ✓
                        </span>
                        <span>•</span>
                        <span className="text-rose-700 font-semibold">
                          {m.disputedCount || 0} Disputed ✗
                        </span>
                        {confirmRate !== null && (
                          <span className="text-[11px] text-slate-400">
                            ({confirmRate}% local confirmation)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVoteMilestone(m._id, 'verify')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Verify ✓</span>
                        </button>

                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for disputing this public work:');
                            if (reason && reason.trim().length >= 5) {
                              handleVoteMilestone(m._id, 'dispute', reason);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 transition"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Dispute ✗</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Submit a Correction Request
            </h3>
            <p className="text-xs text-slate-600">
              Any citizen or official can request a factual audit if an outcome or figure appears in error. Platform admins review and recompute if validated.
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
                  placeholder="e.g. Asks response SLA % or Issue #412 take-up date"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Evidence / Factual Explanation *
                </label>
                <textarea
                  required
                  rows={4}
                  value={correctionExplanation}
                  onChange={(e) => setCorrectionExplanation(e.target.value)}
                  placeholder="Please state the specific discrepancy and supporting documentation or links..."
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

      {/* Dispute Work Update Modal */}
      {disputeModalUpdateId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Dispute Self-Reported Work</h3>
              </div>
              <button
                onClick={() => setDisputeModalUpdateId(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Disputes cross-check self-reported updates against community ground reality. Please explain why this claim is inaccurate. Submissions are subject to community guidelines.
            </p>

            <form onSubmit={handleDisputeUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Dispute <span className="text-rose-500">*</span> (min 20 characters)
                </label>
                <textarea
                  required
                  rows={4}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. This road resurfacing was only partially completed; potholes remain on the southern stretch..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {disputeReason.length}/20 min characters
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalUpdateId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute || disputeReason.trim().length < 20}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition disabled:opacity-50"
                >
                  {isSubmittingDispute ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RepresentativeRecordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RepresentativeRecordContent />
    </Suspense>
  );
}
