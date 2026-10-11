'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  UserCheck,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function RepUpdatesModerationPage() {
  const { user, token } = useAuth();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending_moderation' | 'published' | 'rejected' | 'all'>('pending_moderation');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchUpdates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/rep-updates?status=${statusFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setUpdates(data.updates || []);
      }
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [token, statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('Approve and publish this representative update to the public record?')) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/rep-updates/${id}/approve`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setToastMessage('Update approved and published.');
        fetchUpdates();
      } else {
        alert(data.message || 'Failed to approve update.');
      }
    } catch {
      alert('Network error approving update.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId || rejectReason.trim().length < 5) return;
    setActionLoadingId(rejectModalId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/rep-updates/${rejectModalId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setToastMessage('Update rejected with reason.');
        setRejectModalId(null);
        setRejectReason('');
        fetchUpdates();
      } else {
        alert(data.message || 'Failed to reject update.');
      }
    } catch {
      alert('Network error rejecting update.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Admin Console</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
              Rule 6: Pre-moderation Enforced
            </span>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-purple-400/30">
                <FileText className="w-3.5 h-3.5 text-purple-300" />
                <span>Representative Pre-Moderation Queue</span>
              </div>
              <h1 className="text-2xl font-black">Self-Reported Updates Review</h1>
              <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                All self-reported updates by elected representatives must be verified against campaigning rules
                (no appeals for votes, candidate promotion, slogans or party branding) before publication.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-purple-800/60">
            {(['pending_moderation', 'published', 'rejected', 'all'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                  statusFilter === st
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'bg-purple-900/60 text-purple-200 hover:bg-purple-800/70 border border-purple-700/50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* Queue Items */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading representative updates queue...
          </div>
        ) : updates.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-slate-500">
            No updates found matching status filter "{statusFilter.replace(/_/g, ' ')}".
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((up) => {
              const rep = up.representativeProfileId;
              const isActioning = actionLoadingId === up._id;

              return (
                <div
                  key={up._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {rep?.displayName || 'Unknown Representative'}
                          </h3>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {rep?.role?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {up.jurisdictionId?.name || rep?.titleText || 'Constituency'} &bull; Submitted{' '}
                          {new Date(up.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          up.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : up.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {up.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Campaign pre-screening alert */}
                  {up.moderationReason && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Automated Keyword Alert:</strong>
                        <span>{up.moderationReason}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-base font-black text-slate-900">{up.title}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{up.body}</p>
                  </div>

                  {/* Photos */}
                  {up.photos?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {up.photos.map((photo: string, idx: number) => (
                        <img
                          key={idx}
                          src={photo}
                          alt="Proof photo"
                          className="w-full h-32 object-cover rounded-xl border border-slate-200"
                        />
                      ))}
                    </div>
                  )}

                  {up.externalUrl && (
                    <div className="pt-1">
                      <a
                        href={up.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>External Link Documentation</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Actions Bar */}
                  {up.status === 'pending_moderation' && (
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setRejectModalId(up._id);
                          setRejectReason('');
                        }}
                        disabled={isActioning}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject with Reason</span>
                      </button>
                      <button
                        onClick={() => handleApprove(up._id)}
                        disabled={isActioning}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Reject Representative Update</h3>
            <p className="text-xs text-slate-600">
              Specify the compliance reason for rejection (e.g. campaigning language, partisan promotion, or lack of factual civic work detail).
            </p>

            <form onSubmit={handleReject} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State the non-compliance violation clearly..."
                className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectReason.trim().length < 5}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
