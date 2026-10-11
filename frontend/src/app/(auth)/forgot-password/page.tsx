'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';

  const { requestForgotPassword } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError(language === 'mr' ? 'वैध ईमेल पत्ता टाका.' : language === 'hi' ? 'कृपया मान्य ईमेल दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await requestForgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setMessage(res.message || t('resetLinkSentNotice'));
    } else {
      setError(res.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link
          href={`/sign-in${nextQuery}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('backToSignIn')}</span>
        </Link>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t('forgotPasswordTitle')}
        </h1>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {t('forgotPasswordSubtitle')}
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1">Check Your Email</p>
              <p>{message}</p>
            </div>
          </div>

          <Link
            href={`/sign-in${nextQuery}`}
            className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('backToSignIn')}</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="forgot-email" className="block text-xs font-bold text-gray-700 mb-1">
              {t('emailAddressLabel')}
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoFocus
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder={t('emailPlaceholder')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('sendResetLinkBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
