'use client';

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Lock, Mail, Phone, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

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

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithCredentials, verify2FaLogin, requestPhoneOtp, verifyPhoneOtp, getRoleRedirectPath } = useAuth();
  const { t, language } = useLanguage();

  const nextParam = searchParams.get('next');
  const isExpired = searchParams.get('expired') === '1';
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';

  // Auth Mode: 'credentials' | 'phone' | '2fa'
  const [authMode, setAuthMode] = useState<'credentials' | 'phone' | '2fa'>('credentials');

  // Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isPublicComputer, setIsPublicComputer] = useState(false);

  // Phone OTP State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // 2FA State
  const [tempToken, setTempToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');

  // UI / Error state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; phone?: string; otp?: string }>({});

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Client-side validation matching server rules
  const validateCredentials = () => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = language === 'mr' ? 'ईमेल आवश्यक आहे.' : language === 'hi' ? 'ईमेल आवश्यक है।' : 'Email is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = language === 'mr' ? 'वैध ईमेल पत्ता टाका.' : language === 'hi' ? 'कृपया मान्य ईमेल दर्ज करें।' : 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = language === 'mr' ? 'पासवर्ड आवश्यक आहे.' : language === 'hi' ? 'पासवर्ड आवश्यक है।' : 'Password is required.';
    } else if (password.length < 8) {
      errors.password = language === 'mr' ? 'पासवर्ड किमान ८ अक्षरांचा असावा.' : language === 'hi' ? 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए।' : 'Password must be at least 8 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateCredentials()) return;

    setLoading(true);
    const res = await loginWithCredentials(email.trim(), password, isPublicComputer);
    setLoading(false);

    if (res.require2Fa && res.tempToken) {
      setTempToken(res.tempToken);
      setAuthMode('2fa');
      return;
    }

    if (res.success) {
      const safeNext = sanitizeNextPath(nextParam);
      const destination = safeNext || getRoleRedirectPath(res.role);
      router.push(destination);
    } else {
      setErrorMessage(res.message || 'Invalid email or password');
    }
  };

  const handle2FaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaCode.trim()) return;
    setErrorMessage('');
    setLoading(true);

    const res = await verify2FaLogin(tempToken, twoFaCode.trim(), isPublicComputer);
    setLoading(false);

    if (res.success) {
      const safeNext = sanitizeNextPath(nextParam);
      router.push(safeNext || '/');
    } else {
      setErrorMessage(res.message || 'Invalid 2FA code.');
    }
  };

  const handleRequestPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFieldErrors({ phone: language === 'mr' ? '१० अंकी मोबाईल नंबर टाका.' : language === 'hi' ? '10 अंकों का मोबाइल नंबर दर्ज करें।' : 'Enter a valid 10-digit mobile number.' });
      return;
    }
    setFieldErrors({});
    setErrorMessage('');
    setLoading(true);

    const res = await requestPhoneOtp(`+91${cleanPhone.slice(-10)}`);
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      setOtpCountdown(30);
    } else {
      setErrorMessage(res.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setErrorMessage('');
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, '');
    const res = await verifyPhoneOtp(`+91${cleanPhone.slice(-10)}`, otp, isPublicComputer);
    setLoading(false);

    if (res.success) {
      const safeNext = sanitizeNextPath(nextParam);
      router.push(safeNext || '/');
    } else {
      setErrorMessage(res.message || 'Invalid OTP code.');
    }
  };

  return (
    <div className="w-full">
      {/* Session Expired Notice */}
      {isExpired && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{t('sessionExpiredNotice')}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. CREDENTIALS SIGN IN */}
      {authMode === 'credentials' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t('signInBtn')}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t('citizenRoleDesc')}
            </p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="signin-email" className="block text-xs font-bold text-gray-700 mb-1">
                {t('emailAddressLabel')}
              </label>
              <div className="relative">
                <input
                  ref={emailInputRef}
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  onBlur={() => {
                    if (email) validateCredentials();
                  }}
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'signin-email-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    fieldErrors.email
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="signin-email-error" className="text-[11px] text-red-600 font-semibold mt-1" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="signin-password" className="block text-xs font-bold text-gray-700">
                  {t('passwordLabel')}
                </label>
                <Link
                  href={`/forgot-password${nextQuery}`}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                >
                  {t('forgotPasswordLink')}
                </Link>
              </div>

              <div className="relative">
                <input
                  ref={passwordInputRef}
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  onKeyDown={(e) => {
                    if (e.getModifierState) {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                    }
                  }}
                  placeholder="••••••••"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'signin-password-error' : undefined}
                  className={`w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    fieldErrors.password
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
                  }`}
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

              {fieldErrors.password && (
                <p id="signin-password-error" className="text-[11px] text-red-600 font-semibold mt-1" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Public Computer Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="signin-public"
                type="checkbox"
                checked={isPublicComputer}
                onChange={(e) => setIsPublicComputer(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer"
              />
              <label htmlFor="signin-public" className="text-xs text-gray-600 font-medium select-none cursor-pointer">
                {t('publicComputerLabel') || 'This is a shared or public computer (12h session)'}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

          {/* Secondary Option: Phone OTP */}
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode('phone');
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-orange-600 transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{language === 'mr' ? 'मोबाईल नंबर (OTP) द्वारे साइन इन करा' : language === 'hi' ? 'मोबाइल नंबर (OTP) से साइन इन करें' : 'Use phone number (OTP) instead'}</span>
            </button>
          </div>

          {/* Link to Sign-Up */}
          <div className="mt-6 text-center">
            <span className="text-xs text-gray-500">
              {language === 'mr' ? 'नवीन आहात का? ' : language === 'hi' ? 'नया खाता बनाना है? ' : 'New to RAISE? '}
            </span>
            <Link
              href={`/sign-up${nextQuery}`}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition underline underline-offset-2"
            >
              {t('signUpBtn')}
            </Link>
          </div>
        </>
      )}

      {/* 2. PHONE OTP FLOW (Passwordless fallback) */}
      {authMode === 'phone' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {language === 'mr' ? 'मोबाईल नंबरने साइन इन' : language === 'hi' ? 'मोबाइल नंबर से साइन इन' : 'Sign in with Mobile'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'mr' ? 'आपल्या मोबाईलवर ६ अंकी ओटीपी पाठवला जाईल.' : language === 'hi' ? 'आपके मोबाइल पर 6 अंकों का ओटीपी भेजा जाएगा।' : 'We will send a 6-digit verification code.'}
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleRequestPhoneOtp} className="space-y-4">
              <div>
                <label htmlFor="signin-phone" className="block text-xs font-bold text-gray-700 mb-1">
                  {t('optionalPhone') || 'Mobile Number'}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs font-bold text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl select-none">
                    +91
                  </span>
                  <input
                    id="signin-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 text-sm rounded-r-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{t('sendOtp') || 'Send OTP'}</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div>
                <label htmlFor="signin-otp" className="block text-xs font-bold text-gray-700 mb-1">
                  {t('enterOtp') || 'Enter 6-digit OTP'}
                </label>
                <input
                  id="signin-otp"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{t('verifyLogin') || 'Verify & Sign In'}</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode('credentials');
                setErrorMessage('');
              }}
              className="text-xs font-bold text-gray-600 hover:text-orange-600 transition cursor-pointer"
            >
              {language === 'mr' ? '← ईमेल व पासवर्डने साइन इन करा' : language === 'hi' ? '← ईमेल एवं पासवर्ड से साइन इन करें' : '← Back to Email & Password'}
            </button>
          </div>
        </>
      )}

      {/* 3. 2FA CHALLENGE */}
      {authMode === '2fa' && (
        <form onSubmit={handle2FaSubmit} className="space-y-4">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t('twoFactorAuth') || 'Two-Factor Authentication'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t('enter2FaCode') || 'Enter the 6-digit verification code from your authenticator app.'}
            </p>
          </div>

          <div>
            <label htmlFor="signin-2fa" className="block text-xs font-bold text-gray-700 mb-1">
              {t('enter2FaCode') || 'Security Code'}
            </label>
            <input
              id="signin-2fa"
              type="text"
              autoFocus
              required
              maxLength={10}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value)}
              placeholder="123456 or XXXX-XXXX"
              className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !twoFaCode.trim()}
            className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{t('verifyLogin') || 'Verify & Continue'}</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading sign in...</div>}>
      <SignInContent />
    </Suspense>
  );
}
