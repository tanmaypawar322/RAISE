'use client';

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  XCircle,
  ShieldAlert,
  ArrowRight,
  KeyRound,
  FileText,
  UserCheck,
} from 'lucide-react';

function sanitizeNextPath(rawNext?: string | null): string | null {
  if (!rawNext) return null;
  let decoded = rawNext;
  try {
    decoded = decodeURIComponent(rawNext);
  } catch {}
  if (
    decoded.startsWith('/') &&
    !decoded.startsWith('//') &&
    !decoded.startsWith('/\\') &&
    !decoded.includes('://') &&
    !decoded.includes('\\')
  ) {
    return decoded;
  }
  return null;
}

function OfficeSignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials, verify2FaLogin } = useAuth();
  const { t, language } = useLanguage();

  const nextParam = searchParams.get('next');
  const isExpired = searchParams.get('expired') === '1';
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isPublicComputer, setIsPublicComputer] = useState(false);

  // 2FA state
  const [require2FaChallenge, setRequire2FaChallenge] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Status screens for non-active officers
  const [accountStatus, setAccountStatus] = useState<'pending' | 'rejected' | 'suspended' | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccountStatus(null);

    if (!email.trim() || !password) {
      setError(language === 'mr' ? 'ईमेल आणि पासवर्ड आवश्यक आहेत.' : language === 'hi' ? 'ईमेल और पासवर्ड आवश्यक हैं।' : 'Email and password are required.');
      return;
    }

    setLoading(true);
    const res = await loginWithCredentials(email.trim(), password, isPublicComputer);
    setLoading(false);

    if (res.require2Fa && res.tempToken) {
      setTempToken(res.tempToken);
      setRequire2FaChallenge(true);
      return;
    }

    if (res.success) {
      // Check if user status is pending
      const safeNext = sanitizeNextPath(nextParam) || '/office-portal';
      router.push(safeNext);
    } else {
      const msg = res.message || '';
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('verification')) {
        setAccountStatus('pending');
      } else if (msg.toLowerCase().includes('suspended')) {
        setAccountStatus('suspended');
      } else if (msg.toLowerCase().includes('rejected')) {
        setAccountStatus('rejected');
        setStatusReason(msg);
      } else {
        setError(msg || 'Invalid official email or password.');
      }
    }
  };

  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim()) return;
    setError('');
    setLoading(true);

    const res = await verify2FaLogin(tempToken, totpCode.trim(), isPublicComputer);
    setLoading(false);

    if (res.success) {
      const safeNext = sanitizeNextPath(nextParam) || '/office-portal';
      router.push(safeNext);
    } else {
      setError(res.message || 'Invalid security code.');
    }
  };

  return (
    <div className="w-full">
      {/* Session Expired Notice */}
      {isExpired && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{t('sessionExpiredNotice')}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STATUS STATE: PENDING REVIEW */}
      {accountStatus === 'pending' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {t('requestStatusPendingTitle')}
            </h2>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-sm mx-auto">
              {t('requestStatusPendingDesc')}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href={`/office/request-status?email=${encodeURIComponent(email)}`}
              className="w-full min-h-[44px] py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>{t('requestStatusBtn')}</span>
            </Link>
            <button
              type="button"
              onClick={() => setAccountStatus(null)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition py-1"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* STATUS STATE: REJECTED */}
      {accountStatus === 'rejected' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {t('requestStatusRejectedTitle')}
            </h2>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-sm mx-auto">
              {statusReason || t('requestStatusRejectedDesc')}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href="/office/request-access"
              className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Submit a New Request</span>
            </Link>
            <button
              type="button"
              onClick={() => setAccountStatus(null)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition py-1"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* STATUS STATE: SUSPENDED */}
      {accountStatus === 'suspended' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              {t('requestStatusSuspendedTitle')}
            </h2>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-sm mx-auto">
              {t('requestStatusSuspendedDesc')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono">
            Contact Support: support@raise.org
          </div>
          <button
            type="button"
            onClick={() => setAccountStatus(null)}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 transition py-1"
          >
            Back to Sign In
          </button>
        </div>
      )}

      {/* STANDARD SIGN IN FORM */}
      {!accountStatus && !require2FaChallenge && (
        <>
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold mb-2">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span>Official / Agency Access</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t('officeSignInTitle')}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t('officeSignInSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="office-email" className="block text-xs font-bold text-gray-700 mb-1">
                {t('workEmailLabel')}
              </label>
              <input
                id="office-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer.water@pcmc.gov.in or contact@agency.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="office-password" className="block text-xs font-bold text-gray-700">
                  {t('passwordLabel')}
                </label>
                <Link
                  href={`/forgot-password${nextQuery}`}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 transition"
                >
                  {t('forgotPasswordLink')}
                </Link>
              </div>

              <div className="relative">
                <input
                  id="office-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.getModifierState) {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
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

              {isCapsLockOn && (
                <p className="text-[11px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {t('capsLockWarning')}
                </p>
              )}
            </div>

            {/* Public Computer Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="office-public"
                type="checkbox"
                checked={isPublicComputer}
                onChange={(e) => setIsPublicComputer(e.target.checked)}
                className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-gray-300 cursor-pointer"
              />
              <label htmlFor="office-public" className="text-xs text-gray-600 font-medium select-none cursor-pointer">
                {t('publicComputerLabel') || 'Shared terminal / public computer (12h session)'}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('signInBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Office Links: Claim Office & Check Status */}
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <Link
              href={`/office/request-access${nextQuery}`}
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/50 text-xs font-bold text-gray-700 hover:text-blue-900 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-700" />
                <span>{t('requestAccessBtn')}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>

            <Link
              href="/office/request-status"
              className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>{t('requestStatusBtn')}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </>
      )}

      {/* 2FA Challenge */}
      {require2FaChallenge && (
        <form onSubmit={handle2FaSubmit} className="space-y-4">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t('twoFactorAuth') || 'Two-Factor Authentication'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t('enter2FaCode') || 'Enter the 6-digit code or backup code from your authenticator app.'}
            </p>
          </div>

          <div>
            <label htmlFor="office-2fa" className="block text-xs font-bold text-gray-700 mb-1">
              {t('enter2FaCode') || 'Authentication Code'}
            </label>
            <input
              id="office-2fa"
              type="text"
              autoFocus
              required
              maxLength={10}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456 or XXXX-XXXX"
              className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !totpCode.trim()}
            className="w-full min-h-[44px] py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function OfficeSignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading office sign in...</div>}>
      <OfficeSignInContent />
    </Suspense>
  );
}
