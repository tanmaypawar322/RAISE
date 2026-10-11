'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import {
  ShieldAlert,
  Wallet,
  PlusCircle,
  Trash2,
  Download,
  ArrowLeft,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminFinancePage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // New entry form state
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('hosting');
  const [amountRupees, setAmountRupees] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [entriesRes, ledgerRes] = await Promise.all([
        fetch(`${apiUrl}/admin/finance/entries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/finance/public-ledger`),
      ]);

      const entriesData = await entriesRes.json();
      if (entriesData.success) {
        setEntries(entriesData.entries || []);
      }

      const ledgerData = await ledgerRes.json();
      if (ledgerData.success) {
        setSummary(ledgerData);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    setSubmitting(true);

    try {
      const parsedRupees = parseFloat(amountRupees);
      if (isNaN(parsedRupees) || parsedRupees <= 0) {
        throw new Error('Please enter a valid rupee amount.');
      }

      const amountPaise = Math.round(parsedRupees * 100);

      const res = await fetch(`${apiUrl}/admin/finance/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          category,
          amountPaise,
          date,
          description,
          sourceName: sourceName.trim() || undefined,
          isPublic: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to record entry.');
      }

      setFormMsg({ type: 'success', text: 'Finance entry recorded and logged to audit trail!' });
      setDescription('');
      setAmountRupees('');
      setSourceName('');
      fetchData();
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ledger entry?')) return;

    try {
      const res = await fetch(`${apiUrl}/admin/finance/entries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Failed to delete entry.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-600 mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-1">Admin Access Required</h1>
          <p className="text-xs text-slate-600 mb-4">
            Only system administrators can access the financial ledger administration.
          </p>
          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatRupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Finance & Ledger Administration
              </h1>
              <p className="text-xs text-slate-500">
                Record audited platform operational expenses, CA filings, and inspect live ledger totals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/transparency"
              target="_blank"
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              View Public Page ↗
            </Link>
            <a
              href={`${apiUrl}/finance/public-ledger/export-csv`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Ledger Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Total Inflow (Donations + Subscriptions)
              </span>
              <div className="text-xl font-bold text-emerald-700">
                {formatRupees(summary.totals.totalIncomePaise)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Total Outflow (Audited Expenses)
              </span>
              <div className="text-xl font-bold text-rose-700">
                {formatRupees(summary.totals.totalExpensePaise)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Net Operating Balance
              </span>
              <div className="text-xl font-bold text-slate-900">
                {formatRupees(summary.totals.netBalancePaise)}
              </div>
            </div>
          </div>
        )}

        {/* Record Entry Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-purple-600" />
            <span>Record Operational Expense or External Grant</span>
          </h2>

          {formMsg && (
            <div
              className={`p-3 rounded-xl text-xs ${
                formMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateEntry} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Entry Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="expense">Expense (Outflow)</option>
                <option value="income">Income / Grant (Inflow)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="hosting">Cloud Hosting & Infrastructure</option>
                <option value="sms">SMS / OTP Gateways</option>
                <option value="legal">Legal & DPDP Compliance</option>
                <option value="audit">Statutory CA Audit & Filings</option>
                <option value="grants">Civic Grants</option>
                <option value="payroll">Technology Engineering</option>
                <option value="other">Other Operations</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor / Funder Name (Optional)
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. AWS, Gupshup SMS, Shinde & Associates CA"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly cloud server hosting bill for September"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold rounded-xl transition"
              >
                {submitting ? 'Recording...' : 'Record Entry to Public Ledger'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Manual Entries List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Manual Ledger Records ({entries.length})
            </h3>
            <span className="text-[11px] text-slate-500">Sorted by transaction date</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Vendor/Source</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No manual entries recorded yet. (Revenues from donations and invoices appear automatically on the public ledger.)
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono">
                        {new Date(entry.date).toISOString().slice(0, 10)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            entry.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {entry.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{entry.category}</td>
                      <td className="py-2.5 px-4 max-w-xs truncate">{entry.description}</td>
                      <td className="py-2.5 px-4 text-slate-500">{entry.sourceName || '—'}</td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        {formatRupees(entry.amountPaise)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteEntry(entry._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
