'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '../../../components/Header';
import { Heart, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

function ManageMonthlySupportContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/donations/cancel-monthly`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelToken: token }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Cancellation request failed.');
      }
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full text-center">
      <h1 className="text-xl font-bold text-slate-900 mb-2">Manage Monthly Support</h1>
      <p className="text-xs text-slate-600 mb-6">
        You can pause or cancel your recurring monthly contribution at any time with complete autonomy.
      </p>

      {success ? (
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 text-center shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Monthly Support Canceled
          </h2>
          <p className="text-xs text-slate-600 mb-6">
            Your monthly contribution has been stopped. Your past voluntary contributions continue to be cherished and recorded on the public ledger.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Civic Feed</span>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleCancel}
          className="bg-white p-6 rounded-2xl border border-slate-200 text-left shadow-xs space-y-4"
        >
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Token
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from your monthly email receipt"
              className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Found in the footer of your monthly supporter confirmation emails.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Processing Cancellation...</span>
              ) : (
                <span>Cancel Monthly Recurring Contribution</span>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Nevermind, take me back
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}

export default function ManageMonthlySupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
        <ManageMonthlySupportContent />
      </Suspense>
    </div>
  );
}
