'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '../../../components/Header';
import { CheckCircle2, Heart, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

function DonationThanksContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'one_time';
  const amount = searchParams.get('amount') || '500';
  const donationId = searchParams.get('id');

  return (
    <main className="flex-1 max-w-lg mx-auto px-4 py-16 w-full text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
        <Heart className="w-8 h-8 fill-emerald-600" />
      </div>

      <h1 className="text-2xl font-black text-slate-900 mb-2">Thank you for your support!</h1>
      <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
        Your voluntary contribution of <strong>₹{parseInt(amount, 10).toLocaleString('en-IN')}</strong>{' '}
        {type === 'recurring' ? 'per month' : ''} directly powers independent, advertisement-free civic grievance tracking across India.
      </p>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 text-left text-xs space-y-2 mb-8 shadow-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Status</span>
          <span className="font-bold text-emerald-700">Payment Processed Successfully ✓</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">Receipt Dispatch</span>
          <span className="text-slate-700">Official receipt sent to your email</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-500">Accountability</span>
          <span className="text-slate-700">Recorded on public transparency ledger</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <span>Return to Civic Feed</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/transparency"
          className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-purple-700" />
          <span>View Public Ledger</span>
        </Link>
      </div>
    </main>
  );
}

export default function DonationThanksPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-500">Loading receipt details...</div>}>
        <DonationThanksContent />
      </Suspense>
    </div>
  );
}
