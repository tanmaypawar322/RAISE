'use client';

import React, { useState, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser } = useAuth();
  const { t, language } = useLanguage();

  const nextParam = searchParams.get('next');
  const nextQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Validation / Error state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; email?: string; password?: string; consent?: string }>({});

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Compute password strength: weak | medium | strong
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: t('passwordStrengthWeak'), color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score: 2, label: t('passwordStrengthMedium'), color: 'bg-amber-500' };
    return { score: 3, label: t('passwordStrengthStrong'), color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const validateForm = () => {
    const errors: { displayName?: string; email?: string; password?: string; consent?: string } = {};

    if (!displayName.trim()) {
      errors.displayName = language === 'mr' ? 'टोपणनाव किंवा नाव आवश्यक आहे.' : language === 'hi' ? 'उपनाम या नाम आवश्यक है।' : 'Name or nickname is required.';
    } else if (displayName.trim().length < 2) {
      errors.displayName = language === 'mr' ? 'नाव किमान २ अक्षरांचे असावे.' : language === 'hi' ? 'नाम कम से कम 2 अक्षरों का होना चाहिए।' : 'Name must be at least 2 characters.';
    }

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
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = language === 'mr' ? 'पासवर्डमध्ये एक मोठा अक्षर आणि एक अंक असावा.' : language === 'hi' ? 'पासवर्ड में कम से कम एक बड़ा अक्षर और एक संख्या होनी चाहिए।' : 'Password must contain at least 1 uppercase letter and 1 number.';
    }

    if (!consentChecked) {
      errors.consent = language === 'mr' ? 'कृपया पुढे जाण्यासाठी अटी मान्य करा.' : language === 'hi' ? 'कृपया आगे बढ़ने के लिए शर्तें स्वीकार करें।' : 'Please agree to the Terms and Privacy Policy.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateForm()) return;

    setLoading(true);
    const res = await registerUser({
      name: displayName.trim(),
      displayName: displayName.trim(),
      email: email.trim(),
      password,
      role: 'citizen',
      phone: phone.trim() ? phone.trim() : undefined,
      language,
    });
    setLoading(false);

    if (res.success) {
      // Direct new user to quick onboarding
      router.push(`/onboarding${nextQuery}`);
    } else {
      setErrorMessage(res.message || 'Registration failed. Please check details.');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {t('signUpBtn')}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {language === 'mr' ? 'नागरिक म्हणून नोंदणी करा आणि ६० सेकंदात समस्या मांडा.' : language === 'hi' ? 'नागरिक के रूप में पंजीकरण करें और 60 सेकंड में समस्या उठाएं।' : 'Register as a citizen to report and amplify civic issues.'}
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Display Name Field */}
        <div>
          <label htmlFor="signup-name" className="block text-xs font-bold text-gray-700 mb-1">
            {t('displayNameLabel')}
          </label>
          <input
            ref={nameInputRef}
            id="signup-name"
            type="text"
            autoComplete="nickname"
            autoFocus
            required
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (fieldErrors.displayName) setFieldErrors({ ...fieldErrors, displayName: undefined });
            }}
            placeholder="e.g. Rahul P. or Citizen_Nigdi"
            aria-invalid={Boolean(fieldErrors.displayName)}
            aria-describedby="signup-name-helper"
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
              fieldErrors.displayName
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
            }`}
          />
          <p id="signup-name-helper" className="text-[11px] text-gray-500 mt-1">
            {t('displayNameHelper')}
          </p>
          {fieldErrors.displayName && (
            <p className="text-[11px] text-red-600 font-semibold mt-1" role="alert">
              {fieldErrors.displayName}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="signup-email" className="block text-xs font-bold text-gray-700 mb-1">
            {t('emailAddressLabel')}
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
            }}
            onBlur={() => {
              if (email) validateForm();
            }}
            placeholder={t('emailPlaceholder')}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
              fieldErrors.email
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-200 focus:ring-orange-500 focus:border-orange-500'
            }`}
          />
          {fieldErrors.email && (
            <p id="signup-email-error" className="text-[11px] text-red-600 font-semibold mt-1" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Optional Mobile Phone Field */}
        <div>
          <label htmlFor="signup-phone" className="block text-xs font-bold text-gray-700 mb-1">
            {language === 'mr' ? 'मोबाईल नंबर (पर्यायी - SMS सूचनांसाठी)' : language === 'hi' ? 'मोबाइल नंबर (वैकल्पिक - SMS सूचनाओं के लिए)' : 'Mobile Phone (Optional - for SMS alerts)'}
          </label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
        </div>

        {/* Password Field with Strength Meter */}
        <div>
          <label htmlFor="signup-password" className="block text-xs font-bold text-gray-700 mb-1">
            {t('passwordLabel')}
          </label>

          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
              aria-describedby="signup-password-hint"
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

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 3) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                <span>{t('passwordRulesHint')}</span>
                <span className="font-bold text-gray-700">{strength.label}</span>
              </div>
            </div>
          )}

          {!password && (
            <p id="signup-password-hint" className="text-[11px] text-gray-500 mt-1">
              {t('passwordRulesHint')}
            </p>
          )}

          {isCapsLockOn && (
            <p className="text-[11px] text-amber-700 font-bold mt-1 flex items-center gap-1">
              <span>⚠️</span> {t('capsLockWarning')}
            </p>
          )}

          {fieldErrors.password && (
            <p className="text-[11px] text-red-600 font-semibold mt-1" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (fieldErrors.consent) setFieldErrors({ ...fieldErrors, consent: undefined });
              }}
              className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer shrink-0"
            />
            <span className="text-xs text-gray-600 leading-relaxed">
              {language === 'mr' ? (
                <>
                  मी RAISE च्या{' '}
                  <Link href="/terms" target="_blank" className="font-bold text-orange-600 underline">
                    वापराच्या अटी
                  </Link>{' '}
                  आणि{' '}
                  <Link href="/privacy" target="_blank" className="font-bold text-orange-600 underline">
                    गोपनीयता धोरणाशी
                  </Link>{' '}
                  सहमत आहे. (DPDP 2023)
                </>
              ) : language === 'hi' ? (
                <>
                  मैं RAISE की{' '}
                  <Link href="/terms" target="_blank" className="font-bold text-orange-600 underline">
                    उपयोग की शर्तों
                  </Link>{' '}
                  और{' '}
                  <Link href="/privacy" target="_blank" className="font-bold text-orange-600 underline">
                    गोपनीयता नीति
                  </Link>{' '}
                  से सहमत हूं।
                </>
              ) : (
                <>
                  I agree to RAISE&apos;s{' '}
                  <Link href="/terms" target="_blank" className="font-bold text-orange-600 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="font-bold text-orange-600 underline">
                    Privacy Policy
                  </Link>
                  .
                </>
              )}
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="text-[11px] text-red-600 font-semibold mt-1 pl-6" role="alert">
              {fieldErrors.consent}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>{t('signUpBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link back to Sign In */}
      <div className="mt-6 text-center">
        <span className="text-xs text-gray-500">
          {language === 'mr' ? 'आधीच खाते आहे का? ' : language === 'hi' ? 'पहले से खाता है? ' : 'Already have an account? '}
        </span>
        <Link
          href={`/sign-in${nextQuery}`}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 transition underline underline-offset-2"
        >
          {t('signInBtn')}
        </Link>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading sign up...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
