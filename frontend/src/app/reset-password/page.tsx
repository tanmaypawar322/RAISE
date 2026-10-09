'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { resetPassword, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawToken = searchParams.get('token');
    if (rawToken) {
      setToken(rawToken);
      // Strip token from browser address bar immediately so it is not leaked in history/referrers
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/reset-password');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing or invalid reset token. Please request a new link.');
      return;
    }

    if (newPassword.length < 10) {
      setError(t('passwordPlaceholder'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">
          {t('resetPasswordTitle')}
        </h1>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {t('passwordPlaceholder')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold mb-0.5">Password Reset Complete</strong>
              {t('passwordResetSuccess')}
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              onClick={() => openAuthModal()}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2"
            >
              <span>{t('signInBtn')}</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
              No reset token detected in the URL. Please click the full reset link sent to your email or request a new one below.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('newPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                minLength={10}
                maxLength={128}
                className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50 focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t('confirmPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordLabel')}
                minLength={10}
                maxLength={128}
                className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50 focus:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token || newPassword.length < 10}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? t('pleaseWait') : t('resetPasswordBtn')}
          </button>

          <div className="text-center pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link
              href="/forgot-password"
              className="text-gray-500 hover:text-orange-600 transition"
            >
              Request new link
            </Link>
            <Link
              href="/"
              className="font-bold text-gray-700 hover:text-orange-600 transition inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('backToSignIn')}</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-xs text-gray-500">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
