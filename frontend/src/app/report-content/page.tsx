'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';
import { AlertOctagon, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function ReportContentPage() {
  const { language } = useLanguage();
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('doxxing_pii');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!targetId.trim() || !details.trim() || details.trim().length < 10) {
      setError('Please provide a valid Grievance URL or ID and details of at least 10 characters.');
      return;
    }

    try {
      setLoading(true);
      // Extract issue ID if user pasted full URL
      const cleanId = targetId.includes('/') ? targetId.split('/').filter(Boolean).pop() || targetId : targetId;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/moderation/public-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: cleanId,
          targetType: 'issue',
          reason,
          details,
          reporterEmail: reporterEmail.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit takedown request');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {language === 'mr'
                  ? 'सामग्री काढण्याची विनंती (Takedown Request)'
                  : language === 'hi'
                  ? 'सामग्री हटाने का अनुरोध (Takedown Request)'
                  : 'Report Content / Takedown Request'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit a formal content review or removal request to our designated moderation team.
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Request Submitted Successfully</h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              Your takedown report has been queued for immediate review. Our designated grievance officer will process this within 24 hours under IT Rules 2021.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold transition hover:bg-black"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Grievance URL or ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. https://raise.org/issues/65f00... or 65f00..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Reason for Takedown Request <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="doxxing_pii">Personal Data / Doxxing (DPDP Act Violation)</option>
                <option value="violence">Violence or Incitement</option>
                <option value="sexual">Inappropriate / Explicit Material</option>
                <option value="hate_speech">Hate Speech or Communal Disharmony</option>
                <option value="misleading">Fabricated / Misleading Evidence</option>
                <option value="spam">Commercial Spam or Defamation</option>
                <option value="other">Other Legal Grounds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Specific Details & Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain why this content violates platform policies or legal regulations (min 10 characters)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Your Email Address (Optional for status updates)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting...' : 'Submit Takedown Request'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
