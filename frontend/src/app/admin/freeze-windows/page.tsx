'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  ChevronLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function FreezeWindowsPage() {
  const { token } = useAuth();
  const [windows, setWindows] = useState<any[]>([]);
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState('');
  const [freezeStart, setFreezeStart] = useState('');
  const [freezeEnd, setFreezeEnd] = useState('');
  const [reason, setReason] = useState('Election Commission Model Code of Conduct in effect');
  const [roles, setRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWindows = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/freeze-windows`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setWindows(data.windows || []);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const fetchJurisdictions = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/jurisdictions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setJurisdictions(data.jurisdictions || []);
      }
    } catch {
      // handled
    }
  };

  useEffect(() => {
    fetchWindows();
    fetchJurisdictions();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJurisdictionId || !freezeStart || !freezeEnd || reason.trim().length < 5) {
      alert('Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/freeze-windows`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jurisdictionId: selectedJurisdictionId,
            roles,
            freezeStart,
            freezeEnd,
            reason: reason.trim(),
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setSelectedJurisdictionId('');
        setFreezeStart('');
        setFreezeEnd('');
        setRoles([]);
        setToastMessage('Election freeze window established successfully.');
        fetchWindows();
      } else {
        alert(data.message || 'Failed to establish freeze window.');
      }
    } catch {
      alert('Network error establishing freeze window.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this election freeze window?')) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/freeze-windows/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setToastMessage('Freeze window removed.');
        fetchWindows();
      } else {
        alert(data.message || 'Failed to remove freeze window.');
      }
    } catch {
      alert('Network error removing freeze window.');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/freeze-windows/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentActive }),
        }
      );
      const data = await res.json();
      if (data.success) {
        fetchWindows();
      }
    } catch {
      alert('Error updating status.');
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

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Declare Election Freeze</span>
          </button>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-purple-400/30">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
                <span>Statutory Compliance & Neutrality</span>
              </div>
              <h1 className="text-2xl font-black">Election Freeze Windows (Model Code of Conduct)</h1>
              <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                When the Election Commission announces elections in a constituency or state, active representative
                powers (citizen asks, take-up, self-reported updates) are automatically paused until voting concludes.
                Past scorecards remain fully readable for public record.
              </p>
            </div>
          </div>
        </div>

        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* Windows List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading active freeze windows...
          </div>
        ) : windows.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-slate-500 space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <p>No election freeze windows declared. Platform operating in normal representative mode.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {windows.map((win) => {
              const now = new Date();
              const start = new Date(win.freezeStart);
              const end = new Date(win.freezeEnd);
              const isCurrentlyActive = win.isActive && now >= start && now <= end;

              return (
                <div
                  key={win._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">
                        {win.jurisdictionId?.name || 'All Jurisdictions'}
                      </span>
                      {win.jurisdictionId?.level && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {win.jurisdictionId.level.replace(/_/g, ' ')}
                        </span>
                      )}
                      {isCurrentlyActive ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          <span>Active Freeze (MCC)</span>
                        </span>
                      ) : !win.isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Disabled
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Reason: <strong>{win.reason}</strong>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Start: {start.toLocaleDateString()}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Concludes: {end.toLocaleDateString()}</span>
                      </span>
                    </div>

                    {win.roles?.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400">Restricted Roles:</span>
                        {win.roles.map((r: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                            {r.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleToggleActive(win._id, win.isActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        win.isActive
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {win.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(win._id)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Freeze Window"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Declare Election Freeze Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Establish Election Freeze Window</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Declare Model Code of Conduct window. Representative activity in this jurisdiction will be paused.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jurisdiction / Constituency *
                </label>
                <select
                  required
                  value={selectedJurisdictionId}
                  onChange={(e) => setSelectedJurisdictionId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select affected jurisdiction...</option>
                  {jurisdictions.map((j) => (
                    <option key={j._id} value={j._id}>
                      [{j.level?.toUpperCase()}] {j.name} ({j.code || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Freeze Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={freezeStart}
                    onChange={(e) => setFreezeStart(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Freeze End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={freezeEnd}
                    onChange={(e) => setFreezeEnd(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Compliance Reason *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. Maharashtra Vidhan Sabha General Elections 2024"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Establishing...' : 'Declare Freeze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
