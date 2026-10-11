'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Header } from '../../../components/Header';
import {
  Users,
  Building,
  PhoneCall,
  Mail,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface OutreachItem {
  id: string;
  targetType: 'office' | 'representative';
  targetId: string;
  name: string;
  role: string;
  titleText: string;
  jurisdictionName: string;
  jurisdictionCode: string;
  jurisdictionLevel: string;
  openIssuesCount: number;
  outreachStatus: 'not_contacted' | 'contacted' | 'interested' | 'joined' | 'declined';
  lastContactedAt: string | null;
  notes: string;
  owner: string;
  officialSiteUrl?: string;
  officialEmail?: string;
}

export default function OutreachQueuePage() {
  const { user, token, isInitializing } = useAuth();
  const { language } = useLanguage();

  const [items, setItems] = useState<OutreachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'representative' | 'office'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const fetchOutreach = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (targetTypeFilter !== 'all') params.set('targetType', targetTypeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/outreach?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch outreach queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchOutreach();
    }
  }, [token, user, targetTypeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOutreach();
  };

  const handleUpdateStatus = async (item: OutreachItem, newStatus: string) => {
    if (!token) return;
    setUpdatingId(item.targetId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/outreach/${item.targetType}/${item.targetId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            notes: item.notes,
            lastContactedAt: newStatus !== 'not_contacted' ? new Date().toISOString() : item.lastContactedAt,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.targetId === item.targetId
              ? {
                  ...i,
                  outreachStatus: newStatus as any,
                  lastContactedAt: newStatus !== 'not_contacted' ? new Date().toISOString() : i.lastContactedAt,
                }
              : i
          )
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (item: OutreachItem) => {
    if (!token) return;
    setUpdatingId(item.targetId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/outreach/${item.targetType}/${item.targetId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: item.outreachStatus,
            notes: tempNotes,
            lastContactedAt: item.lastContactedAt,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.targetId === item.targetId ? { ...i, notes: tempNotes } : i))
        );
        setEditingNotesId(null);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadCsv = async () => {
    if (!token) return;
    setDownloadingCsv(true);
    try {
      const params = new URLSearchParams();
      if (targetTypeFilter !== 'all') params.set('targetType', targetTypeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/outreach/export-csv?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to export CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raise-outreach-queue-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error downloading outreach CSV.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleCopyInvite = (item: OutreachItem) => {
    const inviteText = `Namaskar ${item.name},\n\nWe are writing from RAISE (Citizen Voice Platform). Citizens in ${item.jurisdictionName} have raised ${item.openIssuesCount} civic issues awaiting attention from your office.\n\nRAISE provides a neutral, verified public dashboard for elected representatives and civic departments to acknowledge grievances and receive verified credit for resolutions. Verified outcomes are published directly to citizens.\n\nClaim your official profile today at: https://raise.org.in/office/request-access\n\n- RAISE Civic Governance Team`;
    navigator.clipboard.writeText(inviteText);
    setCopiedId(item.targetId);
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-purple-200">Loading Outreach Queue...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-sm text-gray-300 mb-4">You must be logged in as an administrator to access the Outreach Queue.</p>
          <Link href="/admin" className="px-4 py-2 bg-purple-600 rounded-xl text-xs font-bold hover:bg-purple-700">
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const totalOpenIssues = items.reduce((acc, i) => acc + i.openIssuesCount, 0);
  const contactedCount = items.filter((i) => i.outreachStatus !== 'not_contacted').length;
  const joinedCount = items.filter((i) => i.outreachStatus === 'joined').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&larr; Admin Console</span>
          </Link>
          <span className="text-xs text-gray-500 font-mono">Phase 1: Outreach Pipeline CRM</span>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-purple-400/30">
                <Users className="w-3.5 h-3.5 text-purple-300" />
                <span>Elected Representatives & Office Onboarding</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">Outreach Queue & CRM</h1>
              <p className="text-xs text-purple-200 mt-1 max-w-2xl">
                Track outreach to unclaimed elected representatives (MLAs, MPs, Councillors, Sarpanches) and public offices. Sorted by citizen demand (number of unresolved issues).
              </p>
            </div>

            <button
              onClick={handleDownloadCsv}
              disabled={downloadingCsv}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 self-start md:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingCsv ? 'Exporting...' : 'Export Outreach CSV'}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/60">
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Unclaimed Targets</span>
              <p className="text-lg sm:text-xl font-black text-white mt-0.5">{items.length}</p>
            </div>
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Citizen Issues Waiting</span>
              <p className="text-lg sm:text-xl font-black text-amber-300 mt-0.5">{totalOpenIssues}</p>
            </div>
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Contacted</span>
              <p className="text-lg sm:text-xl font-black text-cyan-300 mt-0.5">{contactedCount}</p>
            </div>
            <div className="bg-purple-900/40 p-3 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 font-medium">Joined / Onboarded</span>
              <p className="text-lg sm:text-xl font-black text-emerald-300 mt-0.5">{joinedCount}</p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            {/* Target Type Filter */}
            <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setTargetTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  targetTypeFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTargetTypeFilter('representative')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  targetTypeFilter === 'representative' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Representatives
              </button>
              <button
                type="button"
                onClick={() => setTargetTypeFilter('office')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  targetTypeFilter === 'office' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Offices
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="not_contacted">Not Contacted</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="joined">Joined</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-72">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, seat, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading outreach list...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">No unclaimed targets matching filter.</p>
            <p className="text-xs text-gray-500 mt-1">Try resetting the filters or importing representatives via CSV.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isUpdating = updatingId === item.targetId;
              const isEditingNotes = editingNotesId === item.targetId;
              const isCopied = copiedId === item.targetId;

              const statusColors: Record<string, string> = {
                not_contacted: 'bg-gray-100 text-gray-700 border-gray-200',
                contacted: 'bg-blue-50 text-blue-700 border-blue-200',
                interested: 'bg-amber-50 text-amber-700 border-amber-200',
                joined: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                declined: 'bg-red-50 text-red-700 border-red-200',
              };

              return (
                <div
                  key={`${item.targetType}_${item.targetId}`}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs transition hover:border-purple-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main Target Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            item.targetType === 'representative'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {item.targetType === 'representative' ? (
                            <>
                              <Award className="w-3 h-3" />
                              <span>Elected Representative</span>
                            </>
                          ) : (
                            <>
                              <Building className="w-3 h-3" />
                              <span>Public Office</span>
                            </>
                          )}
                        </span>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                          {item.role.replace(/_/g, ' ')}
                        </span>

                        {item.jurisdictionCode && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                            {item.jurisdictionCode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.titleText && item.titleText !== item.name && (
                          <span className="text-xs text-gray-500 font-normal">({item.titleText})</span>
                        )}
                      </h3>

                      <p className="text-xs text-gray-600 mt-0.5">
                        Jurisdiction: <strong>{item.jurisdictionName}</strong> {item.jurisdictionLevel && `(${item.jurisdictionLevel})`}
                      </p>

                      {/* Notes Section */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 text-xs">
                        {isEditingNotes ? (
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add outreach notes (e.g., call date, PA contact)..."
                              className="flex-1 text-xs px-3 py-1.5 border border-purple-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveNotes(item)}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNotesId(null)}
                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold text-gray-700 text-[11px]">Notes:</span>
                            <span className="italic text-[11px] text-gray-500">
                              {item.notes || 'No notes logged yet.'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNotesId(item.targetId);
                                setTempNotes(item.notes || '');
                              }}
                              className="text-[11px] font-bold text-purple-700 hover:underline ml-1"
                            >
                              Edit
                            </button>
                            {item.owner && (
                              <span className="text-[10px] text-gray-400 ml-auto font-mono">
                                Owner: {item.owner}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right column: Issues count & Outreach status control */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      {/* Open Grievances badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Citizen demand:</span>
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                            item.openIssuesCount > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {item.openIssuesCount} open {item.openIssuesCount === 1 ? 'issue' : 'issues'}
                        </span>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Status:</span>
                        <select
                          value={item.outreachStatus}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(item, e.target.value)}
                          className={`text-xs font-bold rounded-xl px-2.5 py-1 border transition focus:outline-none cursor-pointer ${
                            statusColors[item.outreachStatus] || 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <option value="not_contacted">Not Contacted</option>
                          <option value="contacted">Contacted</option>
                          <option value="interested">Interested</option>
                          <option value="joined">Joined</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      {/* Copy Invitation Template button */}
                      <button
                        type="button"
                        onClick={() => handleCopyInvite(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        }`}
                        title="Copy official invitation message to send via WhatsApp or email"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Invite Copied!' : 'Copy Invite Template'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
