'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  LocateFixed,
  AlertCircle,
  Inbox,
} from 'lucide-react';

interface CitizenPhoneAuthFlowProps {
  onSuccess?: () => void;
  inModal?: boolean;
}

export function CitizenPhoneAuthFlow({ onSuccess, inModal = false }: CitizenPhoneAuthFlowProps) {
  const {
    requestPhoneOtp,
    verifyPhoneOtp,
    updateCitizenProfile,
    loginWithCredentials,
    registerUser,
  } = useAuth();
  const { t, language } = useLanguage();

  // Top-level Auth Method (Email vs Phone OTP)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Email sub-mode (Sign In vs Sign Up)
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone flow steps: 'phone' | 'otp' | 'profile'
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otpBoxes, setOtpBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Common Citizen Profile & DPDP Consent fields
  const [displayName, setDisplayName] = useState('');
  const [homeWard, setHomeWard] = useState('Ward 12 (Nigdi)');
  const [dpdpConsented, setDpdpConsented] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isPublicComputer, setIsPublicComputer] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // 60-Second Cooldown Countdown for Phone OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Email Sign In
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    const res = await loginWithCredentials(email.trim(), password, isPublicComputer);
    setLoading(false);

    if (!res.success) {
      setError(res.message || t('invalidCredentialsMsg'));
    } else {
      if (onSuccess) onSuccess();
    }
  };

  // Handle Email Sign Up
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (password.length < 10) {
      setError(t('passwordPlaceholder'));
      return;
    }

    if (!dpdpConsented) {
      setError(t('consentRequiredMsg'));
      return;
    }

    setLoading(true);
    const res = await registerUser({
      email: email.trim(),
      password,
      name: displayName.trim() || 'Citizen',
      displayName: displayName.trim() || 'Citizen',
      language,
      isPublicComputer,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Registration failed');
    } else {
      if (homeWard) {
        await updateCitizenProfile({
          homeWard,
          language,
          consent: { consentVersion: '1.0', consented: true },
        });
      }
      if (onSuccess) onSuccess();
    }
  };

  // 1. Submit Phone Number for OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMsg('');

    const digitsOnly = phone.replace(/\D/g, '');
    const cleanDigits =
      digitsOnly.startsWith('91') && digitsOnly.length === 12
        ? digitsOnly.slice(2)
        : digitsOnly.startsWith('0') && digitsOnly.length === 11
        ? digitsOnly.slice(1)
        : digitsOnly;

    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setError(t('phoneInvalidMsg'));
      return;
    }

    setLoading(true);
    const res = await requestPhoneOtp(`+91${cleanDigits}`);
    setLoading(false);

    if (!res.success) {
      setError(res.message);
      if (res.retryAfter) {
        setCooldown(res.retryAfter);
      }
    } else {
      setStep('otp');
      setCooldown(60);
      setInfoMsg(res.message);
    }
  };

  // 2. Handle OTP Box Inputs
  const handleOtpBoxChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newBoxes = [...otpBoxes];
    newBoxes[index] = digit;
    setOtpBoxes(newBoxes);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newBoxes = [...otpBoxes];
      for (let i = 0; i < 6; i++) {
        newBoxes[i] = pasted[i] || '';
      }
      setOtpBoxes(newBoxes);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // 3. Verify Phone OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMsg('');

    const fullCode = otpBoxes.join('');
    if (fullCode.length !== 6) {
      setError(t('otpIncompleteMsg'));
      return;
    }

    setLoading(true);
    const res = await verifyPhoneOtp(phone, fullCode, isPublicComputer);
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Verification failed');
      setOtpBoxes(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } else {
      if (!res.isProfileComplete) {
        setStep('profile');
      } else {
        if (onSuccess) onSuccess();
      }
    }
  };

  // 4. GPS Ward Auto-Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setHomeWard('Ward 12 (Nigdi)');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const { latitude } = pos.coords;
        if (latitude > 18.65) {
          setHomeWard('Ward 12 (Nigdi - GPS Verified)');
        } else {
          setHomeWard('Ward 10 (Akurdi - GPS Verified)');
        }
      },
      () => {
        setIsDetectingGps(false);
        setHomeWard('Ward 12 (Nigdi)');
      },
      { timeout: 5000 }
    );
  };

  // 5. Submit Profile Completion for Phone OTP user
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Please enter a display name (at least 2 characters).');
      return;
    }

    if (!dpdpConsented) {
      setError(t('consentRequiredMsg'));
      return;
    }

    setLoading(true);
    const res = await updateCitizenProfile({
      displayName: displayName.trim(),
      homeWard,
      language,
      consent: {
        consentVersion: '1.0',
        consented: true,
      },
    });
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Failed to update profile');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const sampleWards = [
    'Ward 12 (Nigdi - Pradhikaran)',
    'Ward 10 (Akurdi Station)',
    'Ward 8 (Chinchwad Station)',
    'Ward 14 (Bhosari MIDC)',
    'Ward 16 (Pimpri Camp)',
    'Ward 4 (Thergaon - Dange Chowk)',
    'Ward 2 (Ravet - Kiwale)',
  ];

  return (
    <div className={`w-full ${inModal ? '' : 'p-1'}`}>
      {/* Method Selector Segmented Control: Email vs Phone */}
      <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-3.5">
        <button
          type="button"
          onClick={() => {
            setAuthMethod('email');
            setError('');
            setInfoMsg('');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            authMethod === 'email'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{t('authMethodEmail')}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod('phone');
            setError('');
            setInfoMsg('');
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
            authMethod === 'phone'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{t('authMethodPhone')}</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-3.5 p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {infoMsg && (
        <div className="mb-3.5 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{infoMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE A: EMAIL & PASSWORD (NO VERIFICATION CODES NEEDED)       */}
      {/* ============================================================ */}
      {authMethod === 'email' && (
        <div>
          {emailMode === 'signin' ? (
            /* Email Sign In */
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {t('emailAddressLabel')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {t('passwordLabel')}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-bold text-orange-600 hover:underline"
                  >
                    {t('forgotPasswordLink')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={isPublicComputer}
                  onChange={(e) => setIsPublicComputer(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{t('publicComputerLabel')}</span>
              </label>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? t('pleaseWait') : t('signInBtn')}
              </button>

              <div className="text-center pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('signup');
                    setError('');
                  }}
                  className="text-orange-600 font-bold hover:underline cursor-pointer"
                >
                  {t('noAccountYet')}
                </button>
                {process.env.NODE_ENV !== 'production' && (
                  <Link
                    href="/dev/mailbox"
                    className="text-gray-400 hover:text-gray-700 flex items-center gap-1 text-[11px]"
                  >
                    <Inbox className="w-3 h-3" />
                    <span>Mailbox</span>
                  </Link>
                )}
              </div>
            </form>
          ) : (
            /* Email Sign Up */
            <form onSubmit={handleEmailSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {t('pseudonymDisplayName')} *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Nigdi Citizen / Aditya P."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {t('emailAddressLabel')} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  {t('passwordLabel')} * ({t('passwordPlaceholder')})
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    minLength={10}
                    maxLength={128}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {t('wardSelectLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isDetectingGps}
                    className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>{isDetectingGps ? t('locatingGps') : t('detectLocationGps')}</span>
                  </button>
                </div>
                <select
                  value={homeWard}
                  onChange={(e) => setHomeWard(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {sampleWards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* DPDP Consent */}
              <div className="p-2.5 bg-orange-50/60 border border-orange-200/80 rounded-xl text-[10px] text-gray-700 space-y-1.5">
                <div className="flex items-center gap-1 font-bold text-orange-950 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>{t('dpdpNoticeHeading')}</span>
                </div>
                <label className="flex items-start gap-2 pt-0.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dpdpConsented}
                    onChange={(e) => setDpdpConsented(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                    required
                  />
                  <span className="text-[10px] font-bold text-gray-900 leading-tight">
                    {t('dpdpConsentCheckbox')}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !dpdpConsented || !email.trim() || password.length < 10}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? t('pleaseWait') : t('signUpBtn')}
              </button>

              <div className="text-center pt-2 border-t border-gray-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('signin');
                    setError('');
                  }}
                  className="text-orange-600 font-bold hover:underline cursor-pointer"
                >
                  {t('alreadyHaveAccount')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE B: MOBILE PHONE (OTP) FLOW                               */}
      {/* ============================================================ */}
      {authMethod === 'phone' && (
        <div>
          {/* STEP 1: PHONE NUMBER */}
          {step === 'phone' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="phone-input" className="block text-xs font-bold text-gray-800">
                    {t('step1PhoneTitle')}
                  </label>
                  <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                    Step 1 of 2
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                  {t('step1PhoneSubtitle')}
                </p>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1 text-gray-700 font-bold text-sm pointer-events-none select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="w-full pl-18 pr-3.5 py-3 border border-gray-300 rounded-2xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50 focus:bg-white tracking-wider"
                    required
                    aria-label="Mobile Number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t('pleaseWait')}</span>
                ) : (
                  <>
                    <span>{t('sendOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>DPDP Act 2023 Compliant &bull; Phone is encrypted and private</span>
              </div>
            </form>
          )}

          {/* STEP 2: 6-BOX OTP VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800">
                    {t('step2OtpTitle')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                    }}
                    className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>{t('changePhone')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {t('step2OtpSubtitle')} <strong className="text-gray-800">+91 {phone.slice(-10)}</strong>
                </p>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                  {otpBoxes.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-11 sm:h-13 border-2 border-gray-300 focus:border-orange-500 rounded-xl text-center text-xl font-mono font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                      required
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                {cooldown > 0 ? (
                  <span className="text-orange-600 font-bold">
                    {t('resendCooldownMsg')} {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    className="text-orange-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('resendOtpBtn')}</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otpBoxes.join('').length !== 6}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t('pleaseWait')}</span>
                ) : (
                  <>
                    <span>{t('verifyAndProceed')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: PROFILE COMPLETION FOR PHONE USER */}
          {step === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Final Step
                </span>
                <h3 className="text-sm font-extrabold text-gray-900 mt-1">
                  {t('completeProfileStepTitle')}
                </h3>
                <p className="text-[11px] text-gray-500 leading-snug">
                  {t('completeProfileStepSubtitle')}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  {t('pseudonymDisplayName')} *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Nigdi Citizen / Aditya P."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    {t('wardSelectLabel')} *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isDetectingGps}
                    className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>{isDetectingGps ? t('locatingGps') : t('detectLocationGps')}</span>
                  </button>
                </div>
                <select
                  value={homeWard}
                  onChange={(e) => setHomeWard(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  required
                >
                  {sampleWards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-orange-50/60 border border-orange-200/80 rounded-2xl text-[11px] text-gray-700 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-orange-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>{t('dpdpNoticeHeading')}</span>
                </div>
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dpdpConsented}
                    onChange={(e) => setDpdpConsented(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                    required
                  />
                  <span className="text-[10px] font-bold text-gray-900 leading-tight">
                    {t('dpdpConsentCheckbox')}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !dpdpConsented || displayName.trim().length < 2}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span>{t('pleaseWait')}</span>
                ) : (
                  <>
                    <span>{t('saveAndFinishProfile')}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
