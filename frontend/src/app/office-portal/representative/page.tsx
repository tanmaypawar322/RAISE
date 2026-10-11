'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Header } from '../../../components/Header';
import {
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Upload,
  ExternalLink,
  ShieldCheck,
  Building,
  UserPlus,
  MessageSquare,
  Heart,
  Calendar,
  Lock,
  ArrowRight,
  Info,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface RepWorkspaceData {
  profile: any;
  office: any;
  isOfficeAdmin: boolean;
  metrics: {
    pendingAsksCount: number;
    totalAsksCount: number;
    takenUpCount: number;
    resolvedTakenUpCount: number;
    citizenConfirmedCount: number;
    updatesCount: number;
    reportsCount: number;
  };
  asks: any[];
  takenUpIssues: any[];
  updates: any[];
  monthlyReports: any[];
  staffMembers: any[];
}

export default function RepresentativePortalPage() {
  const { user, token, isInitializing } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'asks' | 'taken_up' | 'updates' | 'reports' | 'profile'>('asks');
  const [data, setData] = useState<RepWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action states
  const [takingUpIssueId, setTakingUpIssueId] = useState<string | null>(null);
  const [takeUpNote, setTakeUpNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Inquiry note modal
  const [inquiryIssueId, setInquiryIssueId] = useState<string | null>(null);
  const [inquiryNote, setInquiryNote] = useState('');

  // New Update form state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateCategory, setUpdateCategory] = useState('roads');
  const [updateBody, setUpdateBody] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');

  // Staff invitation modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'officer'>('staff');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  // Right of reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/workspace`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || 'Failed to load representative workspace.');
      }
    } catch {
      setError('Network error while loading representative workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchWorkspace();
    }
  }, [token, user]);

  const handleTakeUpSubmit = async (issueId: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/take-up/${issueId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: takeUpNote }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setActionToast('Issue taken up successfully! Owning department and citizens notified.');
        setTakingUpIssueId(null);
        setTakeUpNote('');
        fetchWorkspace();
      } else {
        alert(json.message || 'Failed to take up issue.');
      }
    } catch {
      alert('Error taking up issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInquirySubmit = async (issueId: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/note/${issueId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: inquiryNote }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setActionToast('Inquiry note transmitted to executive department.');
        setInquiryIssueId(null);
        setInquiryNote('');
        fetchWorkspace();
      } else {
        alert(json.message || 'Failed to transmit note.');
      }
    } catch {
      alert('Error transmitting inquiry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/updates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: updateTitle,
            body: updateBody,
            category: updateCategory,
            externalUrl: updateUrl || undefined,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setActionToast('Update submitted for pre-moderation review.');
        setShowUpdateModal(false);
        setUpdateTitle('');
        setUpdateBody('');
        setUpdateUrl('');
        fetchWorkspace();
      } else {
        alert(json.message || 'Failed to submit update.');
      }
    } catch {
      alert('Error submitting update.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/invite-staff`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: inviteName,
            email: inviteEmail,
            role: inviteRole,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setInviteSuccessMsg(`Invite generated for ${inviteEmail}.`);
        setInviteName('');
        setInviteEmail('');
        fetchWorkspace();
      } else {
        alert(json.message || 'Failed to invite staff.');
      }
    } catch {
      alert('Error inviting staff.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplySubmit = async (reportId: string) => {
    if (!token) return;
    const text = replyTextMap[reportId];
    if (!text || text.trim().length < 5) {
      alert('Please enter a response of at least 5 characters.');
      return;
    }
    setReplyLoadingId(reportId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/reports/${reportId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ replyText: text.trim() }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setActionToast('Formal reply recorded successfully.');
        fetchWorkspace();
      } else {
        alert(json.message || 'Failed to submit reply.');
      }
    } catch {
      alert('Error submitting reply.');
    } finally {
      setReplyLoadingId(null);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-purple-200">Initializing representative portal...</p>
      </div>
    );
  }

  if (!user || user.role !== 'official') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-3xl border border-gray-200 shadow-md text-center my-12">
          <Award className="w-12 h-12 text-purple-700 mx-auto mb-3" />
          <h2 className="text-xl font-black text-gray-900">Representative Workspace</h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            Sign in with your verified elected representative or office account.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/office/sign-in"
              className="px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition"
            >
              Sign In to Office Portal
            </Link>
            <Link
              href="/office/request-access"
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              Claim Representative Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const office = data?.office;
  const metrics = data?.metrics;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {actionToast && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between">
            <span>{actionToast}</span>
            <button type="button" onClick={() => setActionToast(null)} className="text-emerald-600 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Representative Header Banner */}
        <section className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-purple-400/30">
                <Award className="w-3.5 h-3.5 text-purple-300" />
                <span>Elected Representative Office Workspace</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">
                {profile?.displayName || user.name}
              </h1>
              <p className="text-xs text-purple-200 mt-1">
                {profile?.titleText || 'Elected Representative'} &bull;{' '}
                Constituency: <strong>{profile?.jurisdictionId?.name || 'Assigned Area'}</strong> ({profile?.jurisdictionId?.level})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/20 text-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Public Role</span>
              </span>

              <Link
                href="/office-portal"
                className="px-3 py-1.5 bg-purple-800/60 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-bold border border-purple-400/30 transition"
              >
                Department Portal &rarr;
              </Link>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/60">
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Pending Citizen Asks</span>
              <p className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">
                {metrics?.pendingAsksCount ?? 0}
              </p>
            </div>
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Issues Taken Up</span>
              <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                {metrics?.takenUpCount ?? 0}
              </p>
            </div>
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Citizen-Confirmed Credit</span>
              <p className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">
                {metrics?.citizenConfirmedCount ?? 0}
              </p>
            </div>
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Self-Reported Updates</span>
              <p className="text-lg sm:text-xl font-black text-cyan-300 mt-0.5">
                {metrics?.updatesCount ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* Tab Controls: Asks, Taken up, Updates, Reports, Profile */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('asks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'asks'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Asks ({data?.asks.filter((a) => a.status === 'pending').length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('taken_up')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'taken_up'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Taken up ({data?.takenUpIssues.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'updates'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Updates ({data?.updates.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Monthly Reports ({data?.monthlyReports.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Office Profile & Staff</span>
          </button>
        </div>

        {/* TAB 1: ASKS */}
        {activeTab === 'asks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Constituency Citizen Asks</h2>
                <p className="text-xs text-gray-500">
                  Grievances in your constituency where citizens have pressed &ldquo;Ask MLA/MP to look into this&rdquo;.
                </p>
              </div>
              <span className="text-xs font-mono text-gray-500">SLA: 72 Hours</span>
            </div>

            {loading ? (
              <div className="p-8 bg-white rounded-2xl border text-center text-xs text-gray-500">
                Loading citizen asks...
              </div>
            ) : data?.asks.length === 0 ? (
              <div className="p-10 bg-white rounded-2xl border text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-bold text-gray-800">No active citizen asks at this time.</p>
                <p className="text-xs mt-1">When citizens in your constituency ask for assistance, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.asks.map((ask) => {
                  const issue = ask.issueId;
                  const isPending = ask.status === 'pending';

                  return (
                    <div
                      key={ask._id}
                      className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs transition hover:border-purple-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                              {issue?.category || 'Civic Grievance'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              Status: {issue?.status || 'Active'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ask.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-gray-900">
                            {issue?.title || 'Civic Issue'}
                          </h3>

                          <p className="text-xs text-gray-600 mt-1">
                            Location: <strong>{issue?.location?.ward || 'Constituency'}</strong> &bull; Citizen Support:{' '}
                            <strong>{issue?.raiseCount || 0} backers</strong>
                          </p>

                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Ask Submitted: <span className="font-mono">{new Date(ask.createdAt).toLocaleString()}</span>
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setTakingUpIssueId(issue?._id || ask.issueId)}
                                className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Take Up This Issue</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              Taken Up &bull; Active Follow-up
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Taking Up Inline Prompt */}
                      {takingUpIssueId === (issue?._id || ask.issueId) && (
                        <div className="mt-4 pt-3 border-t border-purple-100 bg-purple-50/50 p-3 rounded-xl">
                          <label className="block text-xs font-bold text-purple-950 mb-1">
                            Official Statement on Taking Up (Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={takeUpNote}
                            onChange={(e) => setTakeUpNote(e.target.value)}
                            placeholder="e.g. Discussed with Executive Engineer; requested inspection visit by Friday."
                            className="w-full text-xs p-2.5 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-700"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setTakingUpIssueId(null)}
                              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleTakeUpSubmit(issue?._id || ask.issueId)}
                              className="px-3 py-1.5 text-xs font-bold bg-purple-900 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50"
                            >
                              {actionLoading ? 'Recording...' : 'Confirm & Notify Citizens'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TAKEN UP ISSUES */}
        {activeTab === 'taken_up' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Grievances Taken Up By Your Office</h2>
              <p className="text-xs text-gray-500">
                Issues where you have intervened. Credit is awarded once confirmed resolved by citizens.
              </p>
            </div>

            {data?.takenUpIssues.length === 0 ? (
              <div className="p-10 bg-white rounded-2xl border text-center text-gray-500">
                <Award className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-bold text-gray-800">No issues currently taken up.</p>
                <p className="text-xs mt-1">Review the Asks tab to take up grievances from citizens.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.takenUpIssues.map((issue) => (
                  <div key={issue._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            Owning Dept: {issue.officeId?.name || 'Department'}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            Status: {issue.status}
                          </span>
                          {issue.confirmationStatus === 'resolved_confirmed' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                              ✓ Verified Outcome Credit
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-gray-900">{issue.title}</h3>

                        <p className="text-xs text-gray-600 mt-1">
                          Ward / Location: <strong>{issue.location?.ward || 'Constituency'}</strong> &bull; Citizen Backers:{' '}
                          <strong>{issue.raiseCount}</strong> &bull; Thanks from Citizens:{' '}
                          <strong>{issue.thanksCount || 0} ❤️</strong>
                        </p>

                        {/* Recent Timeline Note */}
                        {issue.statusTimeline?.length > 0 && (
                          <div className="mt-2.5 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <span className="font-semibold text-gray-700">Latest update: </span>
                            {issue.statusTimeline[issue.statusTimeline.length - 1].note}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setInquiryIssueId(issue._id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Request Dept Update
                        </button>
                      </div>
                    </div>

                    {/* Inquiry note dialog */}
                    {inquiryIssueId === issue._id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Inquiry Note to Owning Department
                        </label>
                        <textarea
                          rows={2}
                          value={inquiryNote}
                          onChange={(e) => setInquiryNote(e.target.value)}
                          placeholder="e.g. Please provide an expected completion date for Ward 12 resurfacing."
                          className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-700"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setInquiryIssueId(null)}
                            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleInquirySubmit(issue._id)}
                            className="px-3 py-1 text-xs font-bold bg-purple-900 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50"
                          >
                            Send Inquiry
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SELF-REPORTED UPDATES */}
        {activeTab === 'updates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Self-Reported Work Updates</h2>
                <p className="text-xs text-gray-500">
                  Updates authored by your office. Labelled &ldquo;Self-reported&rdquo; and subject to citizen confirmation or dispute.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>+ Post New Work Update</span>
              </button>
            </div>

            {/* Create update modal */}
            {showUpdateModal && (
              <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-md">
                <h3 className="text-sm font-bold text-purple-950 mb-3">Post Official Work Update</h3>
                <form onSubmit={handleCreateUpdateSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Headline (Max 140 chars) *</label>
                    <input
                      type="text"
                      required
                      maxLength={140}
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      placeholder="e.g. Completed water pipeline repair work at Nigdi Sector 24."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                      <select
                        value={updateCategory}
                        onChange={(e) => setUpdateCategory(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-white"
                      >
                        <option value="roads">Roads & Transport</option>
                        <option value="water">Water Supply & Drainage</option>
                        <option value="sanitation">Sanitation & Waste</option>
                        <option value="health">Health & Clinics</option>
                        <option value="electricity">Electricity & Lighting</option>
                        <option value="general">General Administration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Reference URL (Optional)</label>
                      <input
                        type="url"
                        value={updateUrl}
                        onChange={(e) => setUpdateUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Details & Outcome *</label>
                    <textarea
                      rows={3}
                      required
                      maxLength={2500}
                      value={updateBody}
                      onChange={(e) => setUpdateBody(e.target.value)}
                      placeholder="Describe the completed civic work, location, and benefit to citizens..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-700"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                    <strong>Rule 6 (Non-Negotiable):</strong> Self-reported updates are pre-moderated. Updates must not contain appeals for votes, candidate promotion, attacks on opponents, or party slogans.
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-1.5 text-xs font-bold bg-purple-900 text-white rounded-xl hover:bg-purple-800 disabled:opacity-50"
                    >
                      Submit for Moderation
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Updates list */}
            {data?.updates.length === 0 ? (
              <div className="p-10 bg-white rounded-2xl border text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-bold text-gray-800">No self-reported updates published.</p>
                <p className="text-xs mt-1">Post your first civic progress update using the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.updates.map((update) => (
                  <div key={update._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Self-Reported
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          update.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : update.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {update.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-auto">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900">{update.title}</h3>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">{update.body}</p>

                    {/* Citizen cross-check figures */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
                      <span className="text-emerald-700 font-semibold">
                        ✓ {update.confirmedCount || 0} Citizens Confirmed
                      </span>
                      <span className="text-amber-700 font-semibold">
                        ⚠️ {update.disputedCount || 0} Citizens Disputed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MONTHLY REPORTS WITH RIGHT OF REPLY */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Monthly Performance Reports & Right of Reply</h2>
              <p className="text-xs text-gray-500">
                Monthly reports are generated on the 1st of each month with a 5-day draft right-of-reply window.
              </p>
            </div>

            {data?.monthlyReports.length === 0 ? (
              <div className="p-10 bg-white rounded-2xl border text-center text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-bold text-gray-800">No monthly reports generated yet.</p>
                <p className="text-xs mt-1">First monthly report will generate at the conclusion of the calendar month.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.monthlyReports.map((report) => {
                  const isDraft = report.status === 'draft_reply_window';
                  const deadline = new Date(report.replyDeadline);

                  return (
                    <div key={report._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-purple-50 text-purple-800 px-2.5 py-1 rounded-xl">
                            Period: {report.period}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase ${
                              isDraft ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isDraft ? 'Draft (Right of Reply Active)' : 'Published'}
                          </span>
                        </div>

                        {isDraft && (
                          <span className="text-xs text-amber-800 font-mono">
                            Reply Deadline: {deadline.toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Right of reply input */}
                      {isDraft && (
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 space-y-2 mb-3">
                          <label className="block text-xs font-bold text-purple-950">
                            Representative Formal Reply / Clarification
                          </label>
                          <textarea
                            rows={3}
                            value={replyTextMap[report._id] ?? report.replyText ?? ''}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({ ...prev, [report._id]: e.target.value }))
                            }
                            placeholder="Add official commentary or context to be published alongside these monthly figures..."
                            className="w-full text-xs p-2.5 rounded-lg border border-purple-200 bg-white"
                          />
                          <button
                            type="button"
                            disabled={replyLoadingId === report._id}
                            onClick={() => handleReplySubmit(report._id)}
                            className="px-3.5 py-1.5 text-xs font-bold bg-purple-900 text-white rounded-xl hover:bg-purple-800 disabled:opacity-50"
                          >
                            {replyLoadingId === report._id ? 'Saving...' : 'Save Formal Reply'}
                          </button>
                        </div>
                      )}

                      {report.replyText && !isDraft && (
                        <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 italic border border-gray-100 mb-2">
                          <strong>Official Representative Clarification:</strong> &ldquo;{report.replyText}&rdquo;
                        </div>
                      )}

                      <Link
                        href={`/reports/rep/${profile?._id}/${report.period}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
                      >
                        <span>View Full Published Report &rarr;</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE & STAFF MANAGEMENT */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Official Representative Profile</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Representative Name:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{profile?.displayName}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Public Role:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5 uppercase">{profile?.role?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Constituency / Jurisdiction:</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {profile?.jurisdictionId?.name} ({profile?.jurisdictionId?.level})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Term Dates:</span>
                  <p className="font-bold text-gray-900 font-mono mt-0.5">
                    {profile?.termStart ? new Date(profile.termStart).toLocaleDateString() : 'N/A'} &mdash;{' '}
                    {profile?.termEnd ? new Date(profile.termEnd).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {profile?.officialSiteUrl && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-medium">Official Directory Link: </span>
                  <a
                    href={profile.officialSiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 font-bold underline ml-1"
                  >
                    {profile.officialSiteUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Staff Accounts Management */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Office Staff Accounts</h3>
                  <p className="text-xs text-gray-500">
                    Staff operate through the representative office. Accounts survive individual staff transitions.
                  </p>
                </div>

                {data?.isOfficeAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="px-3 py-1.5 bg-purple-900 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite Staff Member</span>
                  </button>
                )}
              </div>

              {showInviteModal && (
                <form onSubmit={handleInviteStaffSubmit} className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-4 space-y-3">
                  <h4 className="text-xs font-bold text-purple-950">Invite Staff Member to Representative Office</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Staff Full Name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="text-xs p-2.5 rounded-lg border border-purple-200 bg-white"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Staff Email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="text-xs p-2.5 rounded-lg border border-purple-200 bg-white"
                    />
                  </div>
                  {inviteSuccessMsg && <p className="text-xs text-emerald-700 font-bold">{inviteSuccessMsg}</p>}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-3 py-1 text-xs font-bold bg-purple-900 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50"
                    >
                      Generate Invite
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {data?.staffMembers?.map((staff) => (
                  <div key={staff._id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-gray-900">{staff.displayName || staff.name}</strong>{' '}
                      <span className="text-gray-500 font-mono">({staff.email})</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-900">
                      {staff.officeMemberships?.[0]?.memberRole || 'Staff'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
