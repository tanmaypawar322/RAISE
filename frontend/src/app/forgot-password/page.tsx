'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { requestForgotPassword } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await requestForgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setMessage(res.message || t('resetLinkSentNotice'));
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {t('forgotPasswordTitle')}
            </h1>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {t('forgotPasswordSubtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-bold mb-0.5">Link Requested</strong>
                  {message}
                </div>
              </div>

              {process.env.NODE_ENV !== 'production' && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Development mode: View sent link in Dev Mailbox</span>
                  </div>
                  <Link
                    href="/dev/mailbox"
                    className="font-bold text-blue-700 hover:underline shrink-0 text-[11px]"
                  >
                    Open Mailbox &rarr;
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('backToSignIn')}</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('emailAddressLabel')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? t('pleaseWait') : t('sendResetLinkBtn')}
              </button>

              <div className="text-center pt-2 border-t border-gray-100">
                <Link
                  href="/"
                  className="text-xs font-bold text-gray-600 hover:text-orange-600 transition inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('backToSignIn')}</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
