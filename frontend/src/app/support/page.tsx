'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import {
  Heart,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const PRESET_AMOUNTS = [50, 100, 500, 1000];

export default function SupportPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [type, setType] = useState<'one_time' | 'recurring'>('one_time');
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [pan, setPan] = useState('');
  const [want80G, setWant80G] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [showOnSupportersList, setShowOnSupportersList] = useState(false);

  const [declaredNotPolitical, setDeclaredNotPolitical] = useState(false);
  const [declaredNotForeign, setDeclaredNotForeign] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Public supporters list
  const [supporters, setSupporters] = useState<Array<{ name: string; date: string }>>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/donations/supporters`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.supporters) {
          setSupporters(data.supporters);
        }
      })
      .catch(() => {});
  }, []);

  const activeAmount = isCustom ? parseInt(customAmount || '0', 10) : selectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeAmount < 10) {
      setErrorMsg('Minimum contribution amount is ₹10.');
      return;
    }
    if (!declaredNotPolitical || !declaredNotForeign) {
      setErrorMsg('Mandatory civic integrity and FCRA declarations must be confirmed.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/donations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountPaise: activeAmount * 100,
            type,
            donorName: donorName || undefined,
            donorEmail,
            pan: want80G && pan ? pan.toUpperCase() : undefined,
            anonymous,
            showOnSupportersList,
            declarations: {
              notPoliticalEntity: declaredNotPolitical,
              notForeign: declaredNotForeign,
            },
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Donation initialization failed.');
      }

      // Hosted checkout handling (Razorpay / Mock)
      if (data.providerOrderId && (window as any).Razorpay) {
        const options = {
          key: data.keyId,
          amount: data.amountPaise,
          currency: 'INR',
          name: 'RAISE Civic Trust Foundation',
          description: type === 'recurring' ? 'Monthly Civic Supporter' : 'One-Time Contribution',
          order_id: data.providerOrderId,
          prefill: {
            name: donorName,
            email: donorEmail,
          },
          handler: function () {
            window.location.href = `/support/thanks?type=${type}&amount=${activeAmount}`;
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Direct redirect for Mock Provider or local dev test flow
        window.location.href = `/support/thanks?type=${type}&amount=${activeAmount}&id=${data.donationId}`;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Civic Integrity Guarantee Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">
                {t('supportRaiseTitle') || 'Support RAISE'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {t('supportRaiseDesc') ||
                  'Independent, advertisement-free civic grievance infrastructure for India. We never sell personal data or run paid ads.'}
              </p>
              <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Civic Guarantee:</strong>{' '}
                  {t('donationsNeutralNotice') ||
                    'Donations give zero special rights, trust score boosts, or priority on the platform.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Contribution Frequency */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Contribution Frequency
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setType('one_time')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    type === 'one_time'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{t('oneTime') || 'One-Time'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('recurring')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    type === 'recurring'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{t('monthly') || 'Monthly Supporter'}</span>
                </button>
              </div>
            </div>

            {/* 2. Amount Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Amount (INR)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setIsCustom(false);
                    }}
                    className={`py-3 rounded-xl border text-sm font-black transition ${
                      !isCustom && selectedAmount === amt
                        ? 'border-purple-600 bg-purple-900 text-white shadow-xs'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Amount Field */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    isCustom
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Custom Amount
                </button>
                {isCustom && (
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min={10}
                      max={500000}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Donor Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Required for official receipt) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* 4. Tax Receipt / 80G Toggle */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={want80G}
                  onChange={(e) => setWant80G(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>I would like an 80G tax deduction receipt (Indian PAN required)</span>
              </label>

              {want80G && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:outline-none"
                    required={want80G}
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Your PAN is encrypted at rest using AES-256-GCM and never shared publicly.
                  </span>
                </div>
              )}
            </div>

            {/* 5. Privacy & Public Supporters List */}
            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnSupportersList}
                  onChange={(e) => setShowOnSupportersList(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>Show my first name on the public community supporters list</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>Donate completely anonymously (hides name from all platform views)</span>
              </label>
            </div>

            {/* 6. Mandatory Neutrality & FCRA Declarations */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3 text-xs text-purple-950">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declaredNotPolitical}
                  onChange={(e) => setDeclaredNotPolitical(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 mt-0.5"
                  required
                />
                <span>
                  <strong>Civic Neutrality Declaration:</strong> {t('donorDeclaration') ||
                    'I am not donating on behalf of a political party, candidate or government office, and I am not expecting any influence on content or ranking.'}
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={declaredNotForeign}
                  onChange={(e) => setDeclaredNotForeign(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 mt-0.5"
                  required
                />
                <span>
                  <strong>FCRA Declaration:</strong> I am an Indian citizen donating from an Indian bank account. I confirm this donation contains strictly zero foreign funds.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || activeAmount < 10 || !declaredNotPolitical || !declaredNotForeign}
              className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : `Contribute ₹${activeAmount.toLocaleString('en-IN')} ${
                      type === 'recurring' ? '/ month' : ''
                    }`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Public Opt-in Supporters Wall */}
        {supporters.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              Community Supporters
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Citizens and community members who have voluntarily supported independent civic infrastructure.
            </p>

            <div className="flex flex-wrap gap-2">
              {supporters.map((sup, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                  <span>{sup.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
