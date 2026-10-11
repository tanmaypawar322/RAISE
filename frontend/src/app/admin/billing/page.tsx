'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import {
  ShieldAlert,
  CreditCard,
  Building,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  FileText,
} from 'lucide-react';

export default function AdminBillingPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  // Form state for creating invoice-mode subscription
  const [officeId, setOfficeId] = useState('');
  const [planKey, setPlanKey] = useState('office_pro');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('yearly');
  const [buyerName, setBuyerName] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOverview = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/billing/overview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setOverview(data);
      }

      const planRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/plans`
      );
      const planData = await planRes.json();
      if (planData.success) {
        setPlans(planData.plans);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setFormMsg(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/billing/subscriptions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            officeId,
            planKey,
            interval,
            buyerName,
            buyerGstin: buyerGstin || undefined,
            buyerAddress: buyerAddress || undefined,
            buyerEmail: buyerEmail || undefined,
            placeOfSupply,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setFormMsg({
          type: 'success',
          text: `Subscription activated! Tax Invoice generated: ${data.invoice?.number || 'Generated'}`,
        });
        setOfficeId('');
        setBuyerName('');
        fetchOverview();
      } else {
        setFormMsg({ type: 'error', text: data.message || 'Creation failed' });
      }
    } catch {
      setFormMsg({ type: 'error', text: 'Network request error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    if (!token) return;
    const ref = prompt('Enter payment transaction reference (e.g. NEFT/UTR number):');
    if (!ref) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/billing/invoices/${invoiceId}/mark-paid`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentRef: ref }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert('Invoice marked as PAID.');
        fetchOverview();
      }
    } catch {
      alert('Failed to update invoice.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-700" />
                Administrative Billing & Subscriptions Console
              </h1>
              <p className="text-xs text-slate-500">
                Manage government purchase orders, invoice-mode subscriptions, and statutory tax billing.
              </p>
            </div>
          </div>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Active Paid Subscriptions</span>
            <span className="text-2xl font-black text-slate-900">{overview?.activeSubs || 0}</span>
            <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
              Departments & Institutions
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Estimated MRR</span>
            <span className="text-2xl font-black text-slate-900">
              ₹{((overview?.mrrPaise || 0) / 100).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Monthly Recurring Run-rate</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Past Due / Grace Subscriptions</span>
            <span className="text-2xl font-black text-amber-600">{overview?.pastDueCount || 0}</span>
            <span className="text-[11px] text-slate-400 block mt-1">
              7-day grace before safe Basic lapse
            </span>
          </div>
        </div>

        {/* Create Invoice-Mode Subscription Form (Govt / Municipal) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-purple-700" />
            Issue Government / Invoice-Mode Subscription
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Default activation path for municipal corporations and departments paying via treasury / purchase order.
          </p>

          {formMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                formMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {formMsg.text}
            </div>
          )}

          <form onSubmit={handleCreateSubscription} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office Object ID</label>
                <input
                  type="text"
                  value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  placeholder="e.g. 67aa00000000000000000001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan</label>
                <select
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="office_pro">Office Pro (₹4,999/mo)</option>
                  <option value="agency">Agency Partner (₹2,999/mo)</option>
                  <option value="institution">Institution & Research (₹9,999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="yearly">Yearly (Annual PO)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer / Department Legal Name</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. PCMC Executive Engineer (Roads)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department GSTIN (Optional)</label>
                <input
                  type="text"
                  value={buyerGstin}
                  onChange={(e) => setBuyerGstin(e.target.value)}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Place of Supply (State)</label>
                <input
                  type="text"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="accounts@pcmcindia.gov.in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office Postal Address</label>
                <input
                  type="text"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="PCMC Main Building, Pimpri, Pune 411018"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Generating Invoice...' : 'Generate Invoice & Activate Subscription'}
            </button>
          </form>
        </div>

        {/* Existing Subscriptions List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Active Office Subscriptions</h2>
          {overview?.subscriptions && overview.subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">Office</th>
                    <th className="py-2.5 px-3 font-semibold">Plan</th>
                    <th className="py-2.5 px-3 font-semibold">Mode</th>
                    <th className="py-2.5 px-3 font-semibold">Period End</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.subscriptions.map((sub: any) => (
                    <tr key={sub._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {sub.officeId?.name || String(sub.officeId)}
                      </td>
                      <td className="py-2.5 px-3 font-mono uppercase text-slate-600">{sub.planKey}</td>
                      <td className="py-2.5 px-3 text-slate-600">{sub.billingMode}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No custom subscriptions active. All offices currently operate on the free Office Basic tier.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
