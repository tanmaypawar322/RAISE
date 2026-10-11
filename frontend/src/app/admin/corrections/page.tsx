'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import {
  HelpCircle,
  Building2,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Scale,
  Mail,
  AlertTriangle,
} from 'lucide-react';

interface CorrectionRequestItem {
  _id: string;
  targetType: 'office' | 'representative';
  targetId: string;
  itemOrMetric: string;
  explanation: string;
  contactEmail: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  reviewedBy?: { displayName: string; email: string };
  reviewedAt?: string;
  adminNotes?: string;
  outcome?: string;
  createdAt: string;
}

export default function AdminCorrectionsQueuePage() {
  const { user, token, isInitializing } = useAuth();

  const [corrections, setCorrections] = useState<CorrectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRequestItem | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [newStatus, setNewStatus] = useState<'under_review' | 'resolved' | 'rejected'>('resolved');
  const [recomputeMetrics, setRecomputeMetrics] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCorrections = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/corrections${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setCorrections(data.corrections || []);
      }
    } catch {
      console.error('Error fetching corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCorrections();
    }
  }, [token, filterStatus]);

  const handleOpenReview = (c: CorrectionRequestItem) => {
    setSelectedCorrection(c);
    setAdminNotes(c.adminNotes || '');
    setOutcome(c.outcome || '');
    setNewStatus(c.status === 'pending' ? 'under_review' : (c.status as any));
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCorrection || !token) return;

    setUpdating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/corrections/${selectedCorrection._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            adminNotes,
            outcome,
            recomputeMetrics,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setToastMessage('Correction request audit updated successfully.');
        setSelectedCorrection(null);
        fetchCorrections();
      } else {
        alert(data.message || 'Error updating correction');
      }
    } catch {
      alert('Network error updating correction request');
    } finally {
      setUpdating(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">Admin Authorization Required</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">You must sign in as a platform administrator to access this audit queue.</p>
          <Link href="/admin" className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold">
            Go to Admin Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Console</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/admin/outreach"
              className="text-xs font-bold text-purple-700 hover:underline"
            >
              Outreach CRM
            </Link>
          </div>

          <button
            onClick={fetchCorrections}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl shrink-0">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Correction Requests & Scorecard Dispute Audit Queue
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Factual inquiries and correction requests submitted by citizens, representatives, or officials on public metrics. All audit actions and recomputations are immutable.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Filter Status:</span>
          {['all', 'pending', 'under_review', 'resolved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                filterStatus === st
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Corrections Queue List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading audit requests...</p>
          </div>
        ) : corrections.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-xs">
            No correction requests found for the selected status.
          </div>
        ) : (
          <div className="space-y-3">
            {corrections.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        item.targetType === 'representative'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.targetType}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        item.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'pending'
                          ? 'bg-rose-100 text-rose-800'
                          : item.status === 'under_review'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenReview(item)}
                    className="px-3.5 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-800 transition self-start sm:self-auto"
                  >
                    Review / Action
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Disputed Metric: {item.itemOrMetric}
                  </h3>
                  <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {item.explanation}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact: {item.contactEmail}</span>
                  </span>
                  <span>Target ID: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{item.targetId}</code></span>
                  {item.reviewedBy && (
                    <span>Audited by: {item.reviewedBy.displayName}</span>
                  )}
                  {item.outcome && (
                    <span className="font-semibold text-purple-700">Outcome: {item.outcome}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review & Action Modal */}
      {selectedCorrection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Audit Review: {selectedCorrection.itemOrMetric}
            </h3>
            <p className="text-xs text-slate-500">
              Review claimant evidence and record official administrative determination.
            </p>

            <form onSubmit={handleSaveReview} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Audit Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved (Approved & Corrected)</option>
                  <option value="rejected">Rejected (No Error Found)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Administrative Notes</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal audit observations, verification steps..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Public Outcome Statement</label>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="e.g. Corrected SLA adherence from historical logs."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="recomputeMetrics"
                  checked={recomputeMetrics}
                  onChange={(e) => setRecomputeMetrics(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="recomputeMetrics" className="text-xs font-semibold text-purple-900">
                  Trigger automated metric snapshot recomputation
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCorrection(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Audit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
