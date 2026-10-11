'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Search,
  Building2,
} from 'lucide-react';

function RequestStatusContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const initialEmail = searchParams.get('email') || '';
  const { t, language } = useLanguage();

  const [query, setQuery] = useState(initialId || initialEmail);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    id: string;
    officeName: string;
    designation: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
  } | null>(null);

  const fetchStatus = (searchKey: string) => {
    if (!searchKey.trim()) return;
    setLoading(true);
    setSearched(true);

    // Check against mock or API
    setTimeout(() => {
      setLoading(false);
      // Realistic simulated verification state
      if (searchKey.toLowerCase().includes('reject')) {
        setStatusResult({
          id: searchKey,
          officeName: 'PCMC Road Maintenance & Civil Department',
          designation: 'Field Inspector',
          status: 'rejected',
          submittedAt: '2026-10-06T10:30:00.000Z',
          reviewedAt: '2026-10-07T14:15:00.000Z',
          rejectionReason: 'Attached employee ID document expired. Please attach a valid municipal order letter.',
        });
      } else if (searchKey.toLowerCase().includes('approve')) {
        setStatusResult({
          id: searchKey,
          officeName: 'PCMC Water Supply & Drainage Department',
          designation: 'Assistant Municipal Engineer',
          status: 'approved',
          submittedAt: '2026-10-05T09:00:00.000Z',
          reviewedAt: '2026-10-06T11:00:00.000Z',
        });
      } else {
        setStatusResult({
          id: searchKey,
          officeName: 'PCMC Road Maintenance & Civil Department',
          designation: 'Junior Engineer',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        });
      }
    }, 400);
  };

  useEffect(() => {
    if (initialId || initialEmail) {
      fetchStatus(initialId || initialEmail);
    }
  }, [initialId, initialEmail]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(query);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link
          href="/office/sign-in"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-900 transition mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Office Sign In</span>
        </Link>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t('checkStatusTitle')}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Enter your official work email or claim reference ID to track verification status.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. officer@pcmc.gov.in or CLM-123456"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Check</span>
          </button>
        </div>
      </form>

      {/* Result Card */}
      {searched && (
        <>
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-xs">Looking up claim records...</div>
          ) : statusResult ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-[11px] font-mono text-gray-500 font-bold uppercase">
                  Ref: {statusResult.id}
                </span>

                {statusResult.status === 'pending' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Under Review</span>
                  </span>
                )}

                {statusResult.status === 'approved' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved</span>
                  </span>
                )}

                {statusResult.status === 'rejected' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejected</span>
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-gray-900 block">{statusResult.officeName}</span>
                <span className="text-[11px] text-gray-500 block">Post: {statusResult.designation}</span>
              </div>

              {/* Status Specific Explanations */}
              {statusResult.status === 'pending' && (
                <div className="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
                  <p className="font-bold mb-1">{t('requestStatusPendingTitle')}</p>
                  <p>{t('requestStatusPendingDesc')}</p>
                </div>
              )}

              {statusResult.status === 'approved' && (
                <div className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200 leading-relaxed">
                  <p className="font-bold mb-1">{t('requestStatusApprovedTitle')}</p>
                  <p className="mb-3">{t('requestStatusApprovedDesc')}</p>
                  <Link
                    href="/office/sign-in"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs"
                  >
                    <span>Sign in to Office Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {statusResult.status === 'rejected' && (
                <div className="text-xs text-red-900 bg-red-50 p-3 rounded-xl border border-red-200 leading-relaxed">
                  <p className="font-bold mb-1">{t('requestStatusRejectedTitle')}</p>
                  <p className="mb-3">{statusResult.rejectionReason || t('requestStatusRejectedDesc')}</p>
                  <Link
                    href="/office/request-access"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs shadow-xs"
                  >
                    <span>Submit New Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="text-[10px] text-gray-400 pt-1">
                Submitted on: {new Date(statusResult.submittedAt).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-xs">
              No access request record found matching &quot;{query}&quot;.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RequestStatusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading status...</div>}>
      <RequestStatusContent />
    </Suspense>
  );
}
