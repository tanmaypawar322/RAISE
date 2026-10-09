'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../lib/translations';
import { CitizenPhoneAuthFlow } from './CitizenPhoneAuthFlow';
import {
  FileText,
  Megaphone,
  Building2,
  Clock,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ArrowRight,
  Eye,
  Briefcase,
  BadgeCheck,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface AuthLandingViewProps {
  onExploreAsGuest: () => void;
}

export function AuthLandingView({ onExploreAsGuest }: AuthLandingViewProps) {
  const router = useRouter();
  const { loginWithCredentials, registerUser, getRoleRedirectPath } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Persona Track: 'citizen' vs 'office' (Offices, Contractors & Admins)
  const [personaTrack, setPersonaTrack] = useState<'citizen' | 'office'>('citizen');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [officeMode, setOfficeMode] = useState<'signin' | 'register'>('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState('65f000000000000000000001');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const sampleOffices = [
    { id: '65f000000000000000000001', name: 'PCMC Water Supply & Drainage Department', nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग' },
    { id: '65f000000000000000000002', name: 'PCMC Road Maintenance & Civil Infrastructure', nameMr: 'पिं.चिं.म.न.पा. रस्ते देखभाल व स्थापत्य विभाग' },
    { id: '65f000000000000000000003', name: 'PCMC Health & Solid Waste Sanitation (BVG Concessionaire)', nameMr: 'पिं.चिं.म.न.पा. आरोग्य व घनकचरा व्यवस्थापन' },
    { id: '65f000000000000000000004', name: 'MSEDCL Pimpri Electrical Distribution Circle', nameMr: 'महावितरण पिंपरी विद्युत मंडळ' },
    { id: '65f000000000000000000005', name: 'PCMC Ward 10 (Akurdi) Citizen Service Center', nameMr: 'पिं.चिं.म.न.पा. प्रभाग १० (आकुर्डी) क्षेत्रीय कार्यालय' },
    { id: '65f000000000000000000006', name: 'PCMC Ward 12 (Nigdi - Pradhikaran) Zonal Office', nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ (निगडी - प्राधिकरण) क्षेत्रीय कार्यालय' },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await loginWithCredentials(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || t('invalidCredentialsMsg'));
    } else {
      const redirect = getRoleRedirectPath(res.role);
      if (redirect && redirect !== '/') {
        router.push(redirect);
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await registerUser({
      name,
      email,
      password,
      role: 'citizen',
      language,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.message || t('regFailedMsg'));
    }
  };

  const handleOfficeRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await registerUser({
      name,
      email,
      password,
      role: 'official',
      officeId,
      designation: designation || 'Department Representative',
      employeeId,
      language,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.message || t('regFailedMsg'));
    } else {
      setSuccessMsg(t('claimSubmittedNotice'));
      setTimeout(() => {
        router.push('/office-portal');
      }, 1000);
    }
  };

  const pillars = [
    {
      num: '1',
      icon: FileText,
      color: 'bg-orange-100 text-orange-600',
      title: t('pillar1Title'),
      desc: t('pillar1Desc'),
    },
    {
      num: '2',
      icon: Megaphone,
      color: 'bg-blue-100 text-blue-600',
      title: t('pillar2Title'),
      desc: t('pillar2Desc'),
    },
    {
      num: '3',
      icon: Building2,
      color: 'bg-amber-100 text-amber-700',
      title: t('pillar3Title'),
      desc: t('pillar3Desc'),
    },
    {
      num: '4',
      icon: Clock,
      color: 'bg-emerald-100 text-emerald-600',
      title: t('pillar4Title'),
      desc: t('pillar4Desc'),
    },
    {
      num: '5',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      title: t('pillar5Title'),
      desc: t('pillar5Desc'),
    },
  ];

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-gradient-to-b from-orange-50/30 via-white to-gray-50/70 flex flex-col justify-between overflow-x-hidden lg:overflow-hidden select-none">
      {/* Top Header - Proportionate & Aligned with Content Grid */}
      <header className="w-full border-b border-gray-200/80 bg-white/95 backdrop-blur shrink-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-gray-900 tracking-tight leading-none">
                  {t('appTitle')}
                </span>
                <span className="text-[9px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Pilot
                </span>
              </div>
              <p className="text-[10px] text-gray-500 hidden sm:block font-medium leading-tight">
                Report &bull; Amplify &bull; Inform &bull; Solve &bull; Escalate
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-100/90 p-0.5 rounded-xl text-xs">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-3 py-1 rounded-lg font-bold transition text-xs cursor-pointer ${
                  language === l.code
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Split Section - Cohesive 7:5 Grid with Balanced Proportions */}
      <main className="flex-1 min-h-0 flex items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 my-auto overflow-y-auto lg:overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center w-full my-auto">
          {/* Left Column: Platform Showcase */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-3.5">
            {/* Pilot Area Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-bold w-fit">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>{t('pilotNotice')}</span>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {t('landingHeroTitle')}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed font-normal max-w-xl">
                {t('landingHeroSubtitle')}
              </p>
            </div>

            {/* 5 Core Pillars Grid (Clean 2-Column Grid + Anchor Card) */}
            <div className="pt-1">
              <h2 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                {t('whyRaiseTitle')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pillars.slice(0, 4).map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.num}
                      className="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs hover:border-orange-200 transition group flex items-start gap-2.5"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg ${pillar.color} flex items-center justify-center shrink-0 font-bold transition group-hover:scale-105`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 leading-tight">
                          {pillar.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                          {pillar.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Pillar 5 (Escalate) - Spans 2 columns as a prominent anchor card */}
                {(() => {
                  const p5 = pillars[4];
                  const Icon = p5.icon;
                  return (
                    <div className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-200/70 shadow-2xs hover:border-purple-300 transition group flex items-start gap-2.5 sm:col-span-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold transition group-hover:scale-105">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 leading-tight">
                          {p5.title}
                        </h3>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                          {p5.desc}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="pt-2 border-t border-gray-200/70 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs font-medium text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('dpdpBadge')}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs font-medium text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{t('neutralBadge')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In / Sign Up Form Card */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-sm xl:max-w-md bg-white rounded-2xl shadow-xl shadow-orange-500/5 border border-gray-200/90 p-5 sm:p-6 relative max-h-[88vh] overflow-y-auto">
              {/* Primary Stakeholder Persona Switcher */}
              <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setPersonaTrack('citizen');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    personaTrack === 'citizen'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{t('citizenTrack')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonaTrack('office');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    personaTrack === 'office'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('officeTrack')}</span>
                </button>
              </div>

              {/* CARD TITLE & SUBTITLE */}
              <div className="mb-3">
                <h2 className="text-base font-black text-gray-900 tracking-tight leading-tight">
                  {personaTrack === 'citizen'
                    ? authMode === 'signin'
                      ? t('signIn')
                      : t('signUp')
                    : officeMode === 'signin'
                    ? t('signIn')
                    : t('registerOffice')}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {personaTrack === 'citizen'
                    ? authMode === 'signin'
                      ? t('signInSubtitle')
                      : t('signUpSubtitle')
                    : officeMode === 'signin'
                    ? t('officialLoginDesc')
                    : t('officeRegSubtitle')}
                </p>
              </div>

              {/* SECONDARY TRACK TOGGLE FOR OFFICE */}
              {personaTrack === 'office' && (
                <div className="flex items-center p-0.5 bg-blue-50 rounded-lg mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficeMode('signin');
                      setError('');
                    }}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                      officeMode === 'signin'
                        ? 'bg-white text-blue-800 shadow-2xs'
                        : 'text-blue-600 hover:text-blue-900'
                    }`}
                  >
                    {t('signIn')} ({t('officialRole')})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficeMode('register');
                      setError('');
                    }}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                      officeMode === 'register'
                        ? 'bg-white text-blue-800 shadow-2xs'
                        : 'text-blue-600 hover:text-blue-900'
                    }`}
                  >
                    {t('registerOffice')}
                  </button>
                </div>
              )}

              {/* Status Notifications */}
              {error && (
                <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-3 p-2 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* TRACK 1: CITIZEN FLOW (Passwordless Phone + OTP) */}
              {personaTrack === 'citizen' && (
                <>
                  <CitizenPhoneAuthFlow onSuccess={() => router.push('/')} inModal={false} />

                  {/* Secondary Action: Explore as Guest */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onExploreAsGuest}
                      className="w-full py-1.5 px-3 bg-gray-50 hover:bg-orange-50/60 border border-gray-200/90 hover:border-orange-200 text-gray-700 hover:text-orange-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600" />
                      <span>{t('exploreAsGuest')}</span>
                    </button>
                  </div>
                </>
              )}

              {/* TRACK 2: PUBLIC OFFICE & ADMIN FLOW */}
              {personaTrack === 'office' && (
                <>
                  {officeMode === 'signin' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                      <div className="p-2 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 leading-snug">
                        🏛️ <strong>Authority Access:</strong> Officials, Ward Engineers & Agency Leads enter below. You will be routed directly to your management portal.
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('email')}
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="officer@pcmc.gov.in"
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {t('password')}
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-700/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                      >
                        {loading ? (
                          <span>{t('pleaseWait')}</span>
                        ) : (
                          <>
                            <span>{t('signIn')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-0.5">
                        <span className="text-[11px] text-gray-500">Represent an office? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOfficeMode('register');
                            setError('');
                          }}
                          className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          {t('registerOffice')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleOfficeRegisterSubmit} className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          {t('fullName')} *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Ramesh Patil / Ajay Shinde"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          {t('email')} *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. engineer.rahul@gmail.com or bvg.clean@agency.com"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                          required
                        />
                        <p className="text-[9px] text-blue-700 mt-0.5 leading-tight">
                          {t('officeEmailNote')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          {t('selectDepartment')} *
                        </label>
                        <select
                          value={officeId}
                          onChange={(e) => setOfficeId(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition"
                          required
                        >
                          {sampleOffices.map((off) => (
                            <option key={off.id} value={off.id}>
                              {language === 'mr' ? off.nameMr : off.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                            {t('designationLabel')} *
                          </label>
                          <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Jr Engineer / Supervisor"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                            ID / Order Ref
                          </label>
                          <input
                            type="text"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            placeholder="e.g. PCMC-2024"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          {t('password')} *
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('passwordPlaceholder')}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-700/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                      >
                        {loading ? (
                          <span>{t('pleaseWait')}</span>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{t('registerOffice')}</span>
                          </>
                        )}
                      </button>

                      <div className="text-center pt-0.5">
                        <span className="text-[10px] text-gray-500">{t('alreadyHaveAccount')} </span>
                        <button
                          type="button"
                          onClick={() => {
                            setOfficeMode('signin');
                            setError('');
                          }}
                          className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          {t('signIn')}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Footer - Cohesive & Aligned */}
      <footer className="w-full border-t border-gray-200/80 py-2 text-center text-xs text-gray-500 bg-white/80 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>&copy; 2026 RAISE &bull; LokAwaaz Citizen Initiative</span>
          <span>Digital Personal Data Protection (DPDP) Act 2023 Compliant</span>
        </div>
      </footer>
    </div>
  );
}
