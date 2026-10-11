'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { resetPassword } = useAuth();
  const { t, language } = useLanguage();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // If token is missing, show invalid link state
  if (!token) {
    return (
      <div className="w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight mb-2">
          {language === 'mr' ? 'अवैध किंवा मुदत संपलेली लिंक' : language === 'hi' ? 'अमान्य या समाप्त लिंक' : 'Invalid or Expired Link'}
        </h1>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          {language === 'mr'
            ? 'हा पासवर्ड रीसेट दुवा अवैध आहे किंवा त्याची मुदत संपली आहे. कृपया नवीन लिंकची विनंती करा.'
            : language === 'hi'
            ? 'यह पासवर्ड रीसेट लिंक अमान्य है या समाप्त हो चुका है। कृपया नई लिंक का अनुरोध करें।'
            : 'This password reset link is invalid or has expired. Please request a new link.'}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          {t('forgotPasswordTitle')}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(language === 'mr' ? 'पासवर्ड किमान ८ अक्षरांचा असावा.' : language === 'hi' ? 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए।' : 'Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(language === 'mr' ? 'पासवर्ड जुळत नाहीत.' : language === 'hi' ? 'पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.message || 'Failed to reset password. Link may have expired.');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t('resetPasswordTitle')}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {language === 'mr' ? 'आपल्या खात्यासाठी नवीन सुरक्षित पासवर्ड सेट करा.' : language === 'hi' ? 'अपने खाते के लिए नया सुरक्षित पासवर्ड सेट करें।' : 'Set a new secure password for your account.'}
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1">
                {language === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला!' : language === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल गया!' : 'Password Reset Successful!'}
              </p>
              <p>{t('passwordResetSuccess')}</p>
            </div>
          </div>

          <Link
            href="/sign-in"
            className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('signInBtn')}</span>
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
            <label htmlFor="reset-newpass" className="block text-xs font-bold text-gray-700 mb-1">
              {t('newPasswordLabel')}
            </label>
            <div className="relative">
              <input
                id="reset-newpass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirmpass" className="block text-xs font-bold text-gray-700 mb-1">
              {t('confirmPasswordLabel')}
            </label>
            <input
              id="reset-confirmpass"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword}
            className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('resetPasswordBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
