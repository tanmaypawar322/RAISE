'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Language } from '../../../lib/translations';
import { MapPin, Globe, Check, ArrowRight, Sparkles, Navigation } from 'lucide-react';

const PILOT_WARDS = [
  { id: 'Ward 12 (Nigdi Pradhikaran)', label: 'Ward 12 (Nigdi Pradhikaran)', labelMr: 'प्रभाग १२ (निगडी प्राधिकरण)' },
  { id: 'Ward 10 (Akurdi)', label: 'Ward 10 (Akurdi)', labelMr: 'प्रभाग १० (आकुर्डी)' },
  { id: 'Ward 18 (Chinchwad)', label: 'Ward 18 (Chinchwad)', labelMr: 'प्रभाग १८ (चिंचवड)' },
  { id: 'Ward 15 (Pimpri)', label: 'Ward 15 (Pimpri)', labelMr: 'प्रभाग १५ (पिंपरी)' },
  { id: 'Ward 21 (Bhosari)', label: 'Ward 21 (Bhosari)', labelMr: 'प्रभाग २१ (भोसरी)' },
  { id: 'Ward 25 (Sangvi)', label: 'Ward 25 (Sangvi)', labelMr: 'प्रभाग २५ (सांगवी)' },
];

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

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateCitizenProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const nextParam = searchParams.get('next');
  const safeNext = sanitizeNextPath(nextParam) || '/';

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedWard, setSelectedWard] = useState(user?.homeWard || 'Ward 12 (Nigdi Pradhikaran)');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetectedNotice, setGpsDetectedNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const languages: { code: Language; title: string; subtitle: string }[] = [
    { code: 'mr', title: 'मराठी', subtitle: 'माझी पसंतीची भाषा' },
    { code: 'hi', title: 'हिंदी', subtitle: 'मेरी पसंदीदा भाषा' },
    { code: 'en', title: 'English', subtitle: 'Primary language' },
  ];

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsDetectedNotice('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsDetectedNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        // Default detected pilot ward
        setSelectedWard('Ward 12 (Nigdi Pradhikaran)');
        setGpsDetectedNotice(
          language === 'mr'
            ? 'जीपीएस स्थान ओळखले: प्रभाग १२ (निगडी प्राधिकरण)'
            : language === 'hi'
            ? 'स्थान पहचाना गया: वार्ड 12 (निगडी प्राधिकरण)'
            : 'Detected location: Ward 12 (Nigdi Pradhikaran)'
        );
      },
      (err) => {
        setDetectingGps(false);
        setGpsDetectedNotice(
          language === 'mr'
            ? 'स्थान अनुमती नाकारली. कृपया यादीतून निवडा.'
            : language === 'hi'
            ? 'स्थान अनुमति अस्वीकृत। कृपया सूची से चुनें।'
            : 'Location permission denied. Please select from the list.'
        );
      },
      { timeout: 8000 }
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateCitizenProfile({
        language,
        homeWard: selectedWard,
      });
    } catch {
      // Non-fatal, profile can sync later
    }
    setSaving(false);
    router.push(safeNext);
  };

  return (
    <div className="w-full">
      {/* Header with step progress indicator */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
            {step}
          </span>
          <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">
            Step {step} of 2
          </span>
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {step === 1 ? t('chooseLanguageStep') : t('homeWardStep')}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {step === 1
            ? 'Select the language you want to read and report grievances in.'
            : 'Choose your neighborhood so we can show relevant local civic issues.'}
        </p>
      </div>

      {/* STEP 1: LANGUAGE CHOICE */}
      {step === 1 && (
        <div className="space-y-3">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer min-h-[56px] ${
                language === l.code
                  ? 'border-orange-600 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div>
                <span className="font-bold text-base text-gray-900 block">{l.title}</span>
                <span className="text-xs text-gray-500 block">{l.subtitle}</span>
              </div>
              {language === l.code && (
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: HOME WARD */}
      {step === 2 && (
        <div className="space-y-4">
          {/* GPS Auto-detect Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingGps}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50"
          >
            <Navigation className="w-4 h-4 text-orange-600" />
            <span>{detectingGps ? 'Locating...' : t('detectLocationBtn')}</span>
          </button>

          {gpsDetectedNotice && (
            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              {gpsDetectedNotice}
            </p>
          )}

          <div>
            <label htmlFor="ward-select" className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('orSearchWard')}
            </label>
            <select
              id="ward-select"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer min-h-[44px]"
            >
              {PILOT_WARDS.map((w) => (
                <option key={w.id} value={w.id}>
                  {language === 'mr' ? w.labelMr : w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="w-full min-h-[44px] py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('finishOnboarding')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition cursor-pointer"
            >
              {t('skipForNow')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
