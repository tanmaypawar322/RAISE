'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  PlusCircle,
  Filter,
  Send,
  ShieldCheck,
  Check,
  UserCheck,
  Briefcase,
  Upload,
  UserPlus,
  Copy,
  Lock,
  KeyRound,
  FileText,
  LogOut,
  Info,
  BarChart3,
  CreditCard,
  Download,
  ExternalLink,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';

export default function OfficePortalPage() {
  const {
    user,
    token,
    isInitializing,
    loginWithCredentials,
    submitOfficeClaim,
    acceptOfficeInvite,
    requestPhoneOtp,
    verify2FaLogin,
    logoutAll,
  } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'queue' | 'reports' | 'scorecard' | 'billing'>('queue');
  const [officeScorecard, setOfficeScorecard] = useState<any | null>(null);
  const [billingData, setBillingData] = useState<any | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'claim' | 'invite'>('login');
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<'acknowledged' | 'in_progress' | 'resolved' | 'rejected'>('acknowledged');
  const [officialNote, setOfficialNote] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=800');
  const [exceptionReason, setExceptionReason] = useState<string>('');
  const [statusError, setStatusError] = useState('');

  // Login form state
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerError, setOfficerError] = useState('');
  const [officerLoading, setOfficerLoading] = useState(false);
  const [isPublicComputer, setIsPublicComputer] = useState(false);

  // 2FA Challenge state
  const [require2FaChallenge, setRequire2FaChallenge] = useState(false);
  const [temp2FaToken, setTemp2FaToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Office Directory
  const [officesList, setOfficesList] = useState<any[]>([]);

  // Registration / Claim Form State
  const [claimRole, setClaimRole] = useState<'official' | 'agency'>('official');
  const [claimOfficeId, setClaimOfficeId] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimDesignation, setClaimDesignation] = useState('');
  const [claimEmployeeId, setClaimEmployeeId] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimOtp, setClaimOtp] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimOtpSent, setClaimOtpSent] = useState(false);
  const [claimOtpLoading, setClaimOtpLoading] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');
  const [claimError, setClaimError] = useState('');

  // Invite acceptance state
  const [inviteToken, setInviteToken] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteOtp, setInviteOtp] = useState('');
  const [inviteOtpSent, setInviteOtpSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Colleague invitation modal for office heads
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalEmail, setInviteModalEmail] = useState('');
  const [inviteModalRole, setInviteModalRole] = useState<'official' | 'agency'>('official');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  // Report publishing fields
  const [reportTitle, setReportTitle] = useState('');
  const [reportPeriod, setReportPeriod] = useState('Q3 2026');
  const [reportBudget, setReportBudget] = useState('₹ 25,00,000');
  const [reportContent, setReportContent] = useState('');
  const [reportPublished, setReportPublished] = useState(false);

  // Issues queue
  const [assignedIssues, setAssignedIssues] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);

  // Check URL query parameters for invite tokens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inv = params.get('invite');
      if (inv) {
        setInviteToken(inv);
        setAuthTab('invite');
      }
    }
  }, []);

  // Fetch offices directory for claim selection
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices`);
        const data = await res.json();
        if (data.success && data.offices) {
          setOfficesList(data.offices);
          if (data.offices.length > 0 && !claimOfficeId) {
            setClaimOfficeId(data.offices[0]._id);
          }
        }
      } catch {
        // Fallback default offices if server offline
        setOfficesList([
          { _id: '65f000000000000000000003', name: 'PCMC Road Maintenance & Civil Department' },
          { _id: '65f000000000000000000004', name: 'PCMC Water Supply & Drainage Department' },
          { _id: '65f000000000000000000005', name: 'PCMC Health & Sanitation Department' },
        ]);
        setClaimOfficeId('65f000000000000000000003');
      }
    };
    fetchOffices();
  }, []);

  // Fetch assigned issues for user's office
  useEffect(() => {
    const fetchIssues = async () => {
      if (!user) return;
      const officeId = user.officialOfficeId || '65f000000000000000000004';
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/office/${officeId}`
        );
        const data = await res.json();
        if (data.success && data.issues && data.issues.length > 0) {
          setAssignedIssues(data.issues);
        } else {
          // Defaults if no issues in db yet
          setAssignedIssues([
            {
              _id: 'sample_water_1',
              title: 'Irregular Water Supply in Nigdi Sector 24 for Past 3 Days',
              titleMr: 'निगडी सेक्टर २४ मध्ये गेल्या ३ दिवसांपासून पिण्याच्या पाण्याचा अनियमित पुरवठा',
              description: 'Water arrives for only 15 minutes in the morning at very low pressure.',
              category: 'water',
              status: 'submitted',
              raiseCount: 142,
              location: { ward: 'Ward 12', city: 'Pimpri-Chinchwad' },
              createdAt: '2026-10-06T09:00:00.000Z',
            },
            {
              _id: 'sample_water_2',
              title: 'Leakage in Main Distribution Pipeline near Akurdi Market',
              titleMr: 'आकुर्डी भाजी मंडई समोरील मुख्य पाणी वितरण वाहिनीला गळती',
              description: 'Thousands of litres of drinking water is going to waste.',
              category: 'water',
              status: 'acknowledged',
              raiseCount: 95,
              location: { ward: 'Ward 10', city: 'Pimpri-Chinchwad' },
              createdAt: '2026-10-06T18:00:00.000Z',
            },
          ]);
        }
      } catch {
        // Keep samples
      }

      // Fetch live office scorecard metrics
      try {
        const scoreRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/${officeId}`
        );
        const scoreData = await scoreRes.json();
        if (scoreData.success && scoreData.scorecard) {
          setOfficeScorecard(scoreData.scorecard);
        }
      } catch {
        // Keep fallback
      }

      // Fetch office billing details
      try {
        const billRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/office/${officeId}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const billData = await billRes.json();
        if (billData.success) {
          setBillingData(billData);
        }
      } catch {
        // Feature flag may be off
      }
    };
    fetchIssues();
  }, [user, token]);

  const handleExportData = async () => {
    const officeId = user?.officialOfficeId || '67aa00000000000000000001';
    setExportLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/office/${officeId}/export`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `office-export-${officeId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Data export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerError('');
    setOfficerLoading(true);
    const res = await loginWithCredentials(officerEmail, officerPassword, isPublicComputer);
    setOfficerLoading(false);

    if (res.require2Fa) {
      setRequire2FaChallenge(true);
      setTemp2FaToken(res.tempToken || '');
      return;
    }

    if (!res.success) {
      setOfficerError(res.message || t('invalidCredentialsMsg'));
    }
  };

  const handle2FaVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerError('');
    setOfficerLoading(true);
    const res = await verify2FaLogin(temp2FaToken, totpCode, isPublicComputer);
    setOfficerLoading(false);
    if (!res.success) {
      setOfficerError(res.message || t('invalidCredentialsMsg'));
    } else {
      setRequire2FaChallenge(false);
    }
  };

  const handleSendClaimOtp = async () => {
    if (!claimPhone || claimPhone.length < 10) {
      setClaimError(t('phoneInvalidMsg'));
      return;
    }
    setClaimError('');
    setClaimOtpLoading(true);
    const res = await requestPhoneOtp(claimPhone);
    setClaimOtpLoading(false);
    if (res.success) {
      setClaimOtpSent(true);
    } else {
      setClaimError(res.message);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimOtp || claimOtp.length !== 6) {
      setClaimError(t('otpIncompleteMsg'));
      return;
    }

    setClaimError('');
    setClaimSubmitting(true);

    const formData = new FormData();
    formData.append('name', claimName);
    formData.append('email', claimEmail);
    formData.append('password', claimPassword);
    formData.append('phone', claimPhone);
    formData.append('otp', claimOtp);
    formData.append('officeId', claimOfficeId);
    formData.append('role', claimRole);
    formData.append('designation', claimDesignation);
    if (claimEmployeeId) formData.append('employeeId', claimEmployeeId);
    if (claimNotes) formData.append('claimNotes', claimNotes);
    if (claimFile) formData.append('document', claimFile);

    const res = await submitOfficeClaim(formData);
    setClaimSubmitting(false);

    if (res.success) {
      setClaimSuccessMsg(res.message || t('claimSubmittedNotice'));
    } else {
      setClaimError(res.message || t('regFailedMsg'));
    }
  };

  const handleSendInviteOtp = async () => {
    if (!invitePhone || invitePhone.length < 10) {
      setInviteError(t('phoneInvalidMsg'));
      return;
    }
    setInviteError('');
    setInviteLoading(true);
    const res = await requestPhoneOtp(invitePhone);
    setInviteLoading(false);
    if (res.success) {
      setInviteOtpSent(true);
    } else {
      setInviteError(res.message);
    }
  };

  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);

    const res = await acceptOfficeInvite({
      token: inviteToken,
      name: inviteName,
      password: invitePassword,
      phone: invitePhone,
      otp: inviteOtp,
    });
    setInviteLoading(false);

    if (!res.success) {
      setInviteError(res.message || 'Failed to accept invitation.');
    }
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    const officeId = user.officialOfficeId || '65f000000000000000000004';
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/${officeId}/invites`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: inviteModalEmail,
            role: inviteModalRole,
          }),
        }
      );
      const data = await res.json();
      if (data.success && data.inviteUrl) {
        const fullUrl = `${window.location.origin}${data.inviteUrl}`;
        setGeneratedInviteLink(fullUrl);
      }
    } catch {
      // Ignore
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    setStatusError('');

    // Check if user is pending
    if (user?.status === 'pending') {
      alert(t('pendingVerificationBanner'));
      return;
    }

    // Check contractor restriction on 'resolved'
    if (user?.role === 'agency' && statusUpdate === 'resolved') {
      alert(t('contractorResolvedRestriction'));
      return;
    }

    // Check resolution proof
    if (statusUpdate === 'resolved') {
      if (officialNote.trim().length < 10) {
        setStatusError('Resolution note must be at least 10 characters.');
        return;
      }
      if (!afterPhotoUrl && !exceptionReason) {
        setStatusError(t('afterPhotoRequiredMsg'));
        return;
      }
    }

    setAssignedIssues((prev) =>
      prev.map((it) => (it._id === selectedIssue._id ? { ...it, status: statusUpdate } : it))
    );

    if (token) {
      const payload: any = {
        status: statusUpdate,
        note: officialNote,
        resolutionNotes: officialNote,
      };
      if (statusUpdate === 'resolved') {
        if (exceptionReason) {
          payload.exceptionReason = exceptionReason;
        }
        if (afterPhotoUrl) {
          payload.afterPhotos = [{ url: afterPhotoUrl, type: 'photo' }];
        }
      }

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${selectedIssue._id}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      ).catch(() => {});
    }

    setSelectedIssue(null);
    setOfficialNote('');
    setStatusError('');
  };

  const handlePublishReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.status === 'pending') {
      alert(t('pendingVerificationBanner'));
      return;
    }

    const officeId = user?.officialOfficeId || '65f000000000000000000004';
    if (token) {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices/${officeId}/reports`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: reportTitle,
            period: reportPeriod,
            budget: reportBudget,
            content: reportContent,
          }),
        }
      ).catch(() => {});
    }

    const newRep = {
      _id: `rep_${Date.now()}`,
      title: reportTitle,
      period: reportPeriod,
      budget: reportBudget,
      content: reportContent,
      createdAt: new Date().toISOString(),
    };
    setReportsList([newRep, ...reportsList]);
    setReportPublished(true);
    setTimeout(() => setReportPublished(false), 3000);

    setReportTitle('');
    setReportContent('');
  };

  // If verifying session
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-blue-200">{t('sessionInitializing')}</p>
      </div>
    );
  }

  // If visitor is unauthenticated or not official/agency/admin
  if (!user || (user.role !== 'official' && user.role !== 'agency' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 flex flex-col text-white">
        <Header />
        <div className="max-w-lg mx-auto my-auto p-6 sm:p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-blue-400/30 text-center shadow-2xl my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/20">
            <Building2 className="w-7 h-7 text-blue-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-blue-800/80 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
            {t('officialPortalBadge')}
          </span>
          <h2 className="text-xl font-black text-white mt-2 mb-1">{t('officePortal')}</h2>
          <p className="text-xs text-blue-200/80 mb-5 leading-relaxed">
            {t('officialLoginDesc')}
          </p>

          {/* Tab switcher: Sign in vs Register/Claim */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl mb-5 border border-blue-400/20">
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setOfficerError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                authTab === 'login' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-300 hover:text-white'
              }`}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('claim'); setOfficerError(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                authTab === 'claim' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-300 hover:text-white'
              }`}
            >
              {t('claimOfficeTab')}
            </button>
          </div>

          {officerError && (
            <div className="mb-4 p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 font-medium text-left">
              {officerError}
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {authTab === 'login' && !require2FaChallenge && (
            <form onSubmit={handleOfficerLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-blue-200 mb-1">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  placeholder="officer.water@pcmc.gov.in or contractor@agency.com"
                  className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-200 mb-1">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={officerPassword}
                  onChange={(e) => setOfficerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-blue-200 select-none">
                <input
                  type="checkbox"
                  checked={isPublicComputer}
                  onChange={(e) => setIsPublicComputer(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{t('publicComputerLabel')}</span>
              </label>

              <button
                type="submit"
                disabled={officerLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                {officerLoading ? t('pleaseWait') : t('signIn')}
              </button>
            </form>
          )}

          {/* 2FA CHALLENGE MODAL/INLINE */}
          {authTab === 'login' && require2FaChallenge && (
            <form onSubmit={handle2FaVerifySubmit} className="space-y-4 text-left">
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30 text-xs text-blue-200">
                <KeyRound className="w-5 h-5 text-blue-300 mb-1" />
                <span className="font-bold block text-white">{t('twoFactorAuth')}</span>
                <span>{t('enter2FaCode')}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-200 mb-1">
                  {t('enter2FaCode')}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456 or XXXX-XXXX"
                  className="w-full text-center tracking-widest px-3 py-2.5 bg-black/40 border border-blue-400/40 rounded-xl text-sm font-mono text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <span className="text-[10px] text-blue-300/70 block mt-1">{t('orBackupCode')}</span>
              </div>

              <button
                type="submit"
                disabled={officerLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {officerLoading ? t('pleaseWait') : t('verifyLogin')}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER / CLAIM OFFICE */}
          {authTab === 'claim' && (
            <div className="text-left space-y-3">
              {claimSuccessMsg ? (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                  <h4 className="font-bold text-white text-sm">{t('claimSubmittedNotice')}</h4>
                  <p className="text-[11px] leading-relaxed text-emerald-100">{claimSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} className="space-y-3">
                  {claimError && (
                    <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 font-medium">
                      {claimError}
                    </div>
                  )}

                  {/* Role Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-200 mb-1.5">{t('accountType')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setClaimRole('official')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                          claimRole === 'official'
                            ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                            : 'bg-black/30 border-blue-400/30 text-blue-300'
                        }`}
                      >
                        <UserCheck className="w-4 h-4 mb-1 text-blue-200" />
                        <div>{t('officialRoleTitle')}</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClaimRole('agency')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                          claimRole === 'agency'
                            ? 'bg-amber-600 border-amber-400 text-white shadow-xs'
                            : 'bg-black/30 border-blue-400/30 text-blue-300'
                        }`}
                      >
                        <Briefcase className="w-4 h-4 mb-1 text-amber-200" />
                        <div>{t('agencyRoleTitle')}</div>
                      </button>
                    </div>
                  </div>

                  {/* Select Office */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('selectDepartment')}</label>
                    <select
                      value={claimOfficeId}
                      onChange={(e) => setClaimOfficeId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      {officesList.map((off) => (
                        <option key={off._id} value={off._id} className="bg-slate-900 text-white">
                          {off.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name & Designation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('fullName')}</label>
                      <input
                        type="text"
                        value={claimName}
                        onChange={(e) => setClaimName(e.target.value)}
                        placeholder="Rajesh Patil"
                        className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('designationLabel')}</label>
                      <input
                        type="text"
                        value={claimDesignation}
                        onChange={(e) => setClaimDesignation(e.target.value)}
                        placeholder={t('designationPlaceholder')}
                        className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Work Email & Employee ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('officialEmail')}</label>
                      <input
                        type="email"
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('employeeIdLabel')}</label>
                      <input
                        type="text"
                        value={claimEmployeeId}
                        onChange={(e) => setClaimEmployeeId(e.target.value)}
                        placeholder="e.g. PCMC-ENG-2026"
                        className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('password')} (min 8 chars)</label>
                    <input
                      type="password"
                      value={claimPassword}
                      onChange={(e) => setClaimPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  {/* Phone + OTP verification */}
                  <div className="p-3 bg-black/40 rounded-xl border border-blue-400/30 space-y-2">
                    <span className="text-[11px] font-bold text-blue-200 block">Phone Verification (OTP required)</span>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="flex-1 px-3 py-2 bg-black/60 border border-blue-400/40 rounded-xl text-xs text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendClaimOtp}
                        disabled={claimOtpLoading}
                        className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                      >
                        {claimOtpLoading ? t('pleaseWait') : claimOtpSent ? t('resendOtpBtn') : t('sendOtp')}
                      </button>
                    </div>

                    {claimOtpSent && (
                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          value={claimOtp}
                          onChange={(e) => setClaimOtp(e.target.value)}
                          placeholder="6-digit verification code"
                          className="w-full text-center tracking-widest px-3 py-2 bg-black/60 border border-blue-400/40 rounded-xl text-xs text-white font-mono"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Supporting Document Upload */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-200 mb-1">
                      {t('supportingDocLabel')}
                    </label>
                    <div className="relative border border-dashed border-blue-400/40 rounded-xl p-3 bg-black/30 text-center hover:bg-black/40 transition">
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg"
                        onChange={(e) => setClaimFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-5 h-5 text-blue-300 mx-auto mb-1" />
                      <span className="text-xs text-blue-200 block font-medium">
                        {claimFile ? claimFile.name : 'Click or drop PDF / Photo ID (Max 5MB)'}
                      </span>
                    </div>
                  </div>

                  {/* Claim Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('claimNotesLabel')}</label>
                    <textarea
                      rows={2}
                      value={claimNotes}
                      onChange={(e) => setClaimNotes(e.target.value)}
                      placeholder="e.g. Official appointment order number or contractor site supervision beat"
                      className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={claimSubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {claimSubmitting ? t('pleaseWait') : t('submitClaimBtn')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: ACCEPT INVITATION */}
          {authTab === 'invite' && (
            <div className="text-left space-y-3">
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30 text-xs text-blue-200 mb-2">
                <span className="font-bold text-white block">{t('acceptInviteTitle')}</span>
                <span>{t('acceptInviteSubtitle')}</span>
              </div>

              {inviteError && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 font-medium">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleAcceptInviteSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('fullName')}</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Rajesh Patil"
                    className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">{t('password')} (min 8 chars)</label>
                  <input
                    type="password"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full px-3 py-2 bg-black/40 border border-blue-400/40 rounded-xl text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-blue-400/30 space-y-2">
                  <span className="text-[11px] font-bold text-blue-200 block">Phone Verification</span>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="flex-1 px-3 py-2 bg-black/60 border border-blue-400/40 rounded-xl text-xs text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendInviteOtp}
                      disabled={inviteLoading}
                      className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                    >
                      {inviteLoading ? t('pleaseWait') : inviteOtpSent ? t('resendOtpBtn') : t('sendOtp')}
                    </button>
                  </div>

                  {inviteOtpSent && (
                    <input
                      type="text"
                      maxLength={6}
                      value={inviteOtp}
                      onChange={(e) => setInviteOtp(e.target.value)}
                      placeholder="6-digit verification code"
                      className="w-full text-center tracking-widest px-3 py-2 bg-black/60 border border-blue-400/40 rounded-xl text-xs text-white font-mono"
                      required
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {inviteLoading ? t('pleaseWait') : t('verifyAndProceed')}
                </button>
              </form>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-blue-400/20 flex items-center justify-end text-xs text-blue-300/80">
            <Link href="/" className="hover:text-white underline text-[11px]">
              &larr; Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED OFFICIAL / AGENCY PORTAL VIEW
  const isPending = user.status === 'pending';
  const isContractor = user.role === 'agency';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Pending Account Notice Banner */}
        {isPending && (
          <div className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-900">Account Pending Verification</h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                {t('pendingVerificationBanner')}
              </p>
            </div>
          </div>
        )}

        {/* Office Official Identity Banner */}
        <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 text-white shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-700/60 text-blue-100 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isContractor
                    ? `${t('agencyPartnerBadge')} - ${user.name}`
                    : `${t('verifiedOfficialBadge')} - PCMC`}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">
                {language === 'mr' ? 'पिं.चिं.म.न.पा. अधिकृत कार्यालय कक्ष' : 'PCMC Public Authority & Engineering Portal'}
              </h1>
              <p className="text-xs text-blue-200 mt-1">
                {user.designation || 'Department Officer'}: <strong className="text-white">{user.name}</strong> ({user.email}) &bull;{' '}
                <span className={`uppercase text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  isPending ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'
                }`}>
                  {user.status || 'active'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/office-portal/analysis"
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/30 rounded-xl text-xs font-bold text-white transition shadow-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-200" />
                <span>Executive Analysis</span>
              </Link>
              {/* Invite Colleague Button (Only for verified officials / admin) */}
              {!isPending && !isContractor && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('inviteColleagueBtn')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('logoutAllConfirm'))) {
                    logoutAll();
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-400/30 rounded-xl text-xs font-bold text-red-200 transition shadow-xs cursor-pointer"
                title={t('logoutAllDevicesBtn')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('logoutAllDevicesBtn')}</span>
              </button>
              <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 font-semibold">
                {t('jurisdictionCity')}
              </span>
            </div>
          </div>

          {/* Quick Metrics & Response Clock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-700/50 text-left">
            <div className="bg-blue-950/40 p-3.5 rounded-2xl border border-blue-800/60">
              <span className="text-[11px] text-blue-300 block">{t('assignedIssues')}</span>
              <span className="text-xl font-black text-white mt-0.5 block">{assignedIssues.length}</span>
            </div>
            <div className="bg-blue-950/40 p-3.5 rounded-2xl border border-blue-800/60">
              <span className="text-[11px] text-blue-300 block">{t('pendingAck')}</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">1</span>
            </div>
            <div className="bg-blue-950/40 p-3.5 rounded-2xl border border-blue-800/60">
              <span className="text-[11px] text-blue-300 block">{t('inProgressStat')}</span>
              <span className="text-xl font-black text-blue-300 mt-0.5 block">1</span>
            </div>
            <div className="bg-blue-950/40 p-3.5 rounded-2xl border border-blue-800/60">
              <span className="text-[11px] text-blue-300 block">{t('slaClock')}</span>
              <span className="text-sm font-black text-emerald-400 mt-1 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('averageResponseClock')}</span>
              </span>
            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'queue'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('assignedIssues')} ({assignedIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{t('officialWorkReport')}</span>
          </button>

          <button
            onClick={() => setActiveTab('scorecard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'scorecard'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Public Scorecard</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'billing'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('billingTab') || 'Billing & Plan'}</span>
          </button>
        </div>

        {/* TAB 1: ISSUES ACTION QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {assignedIssues.map((issue) => (
              <div key={issue._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {issue.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {issue.location?.ward || 'Ward 12'}, {issue.location?.city || 'Pimpri-Chinchwad'}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      issue.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : issue.status === 'acknowledged'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{issue.status}</span>
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 mb-1">
                  {language === 'mr' && issue.titleMr ? issue.titleMr : issue.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                  {language === 'mr' && issue.descriptionMr ? issue.descriptionMr : issue.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold text-blue-900">
                    {issue.raiseCount} {t('raiseCountText')}
                  </span>

                  <button
                    onClick={() => {
                      if (isPending) {
                        alert(t('pendingVerificationBanner'));
                        return;
                      }
                      setSelectedIssue(issue);
                      setStatusUpdate(issue.status === 'submitted' ? 'acknowledged' : 'in_progress');
                    }}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('officialResponse')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: WORK & BUDGET REPORTS */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('publishReportBtn')}</h2>
              <p className="text-xs text-gray-500 mb-4">{t('officialLoginDesc')}</p>

              {reportPublished && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Report published successfully!</span>
                </div>
              )}

              <form onSubmit={handlePublishReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('reportTitleLabel')}</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g. Monthly Drain Desilting and Sump Overhaul"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('periodLabel')}</label>
                    <input
                      type="text"
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      placeholder="Q3 2026"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t('budgetLabel')}</label>
                    <input
                      type="text"
                      value={reportBudget}
                      onChange={(e) => setReportBudget(e.target.value)}
                      placeholder="₹ 15,00,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('workDetailsLabel')}</label>
                  <textarea
                    rows={4}
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder={t('publicNotePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {t('publishReportBtn')}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('reportsPublished')}</h2>
              {reportsList.map((rep) => (
                <div key={rep._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                      {rep.period}
                    </span>
                    <span className="font-bold text-emerald-700">{rep.budget}</span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1.5">{rep.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{rep.content}</p>
                  <span className="text-[10px] text-gray-400">
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PUBLIC SCORECARD (PHASE 7) */}
        {/* ============================================================ */}
        {activeTab === 'scorecard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      Standardized Office Scorecard v1
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Public Accountability</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-700" />
                    <span>Office Civic Performance Metrics</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Transparent, unvarnished SLA adherence and resolution performance for this administrative jurisdiction.
                  </p>
                </div>

                {user.officialOfficeId && (
                  <Link
                    href={`/offices/${user.officialOfficeId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <span>View Public Page</span>
                  </Link>
                )}
              </div>

              {/* Scorecard KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {/* 1. Total Issues Received */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Total Issues Received</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {officeScorecard?.totalIssuesReceived ?? assignedIssues.length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">all routed grievances</span>
                </div>

                {/* 2. % Acknowledged On Time */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Acknowledged On Time</span>
                  <span
                    className={`text-2xl sm:text-3xl font-black ${
                      (officeScorecard?.percentAcknowledgedOnTime ?? 100) >= 75
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {officeScorecard?.percentAcknowledgedOnTime ?? 100}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">before SLA expiration</span>
                </div>

                {/* 3. % Resolved */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Resolution Rate</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {officeScorecard?.percentResolved ?? 67}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">with proof of work</span>
                </div>

                {/* 4. Median Resolution Days */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Median Resolution Days</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {officeScorecard?.medianResolutionDays ?? 1.5}{' '}
                    <span className="text-xs font-semibold text-slate-500">days</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">filing to proof</span>
                </div>

                {/* 5. Open Issues Count */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Open Active Issues</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-700">
                    {officeScorecard?.openIssuesCount ?? assignedIssues.filter(i => i.status !== 'resolved').length}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">in progress backlog</span>
                </div>

                {/* 6. Overdue Count */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Overdue / Breached</span>
                  <span
                    className={`text-2xl sm:text-3xl font-black ${
                      (officeScorecard?.overdueCount ?? 0) > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {officeScorecard?.overdueCount ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">past SLA target</span>
                </div>
              </div>

              {/* Explainer / Methodology Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950 mb-0.5">
                    How scorecard metrics are calculated
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    Total Issues Received includes all civic grievances routed to this jurisdiction. % Acknowledged On Time measures grievances officially acknowledged before statutory SLA expiry. % Resolved measures closed grievances with verified before/after proof. Median Resolution Days is the typical duration from citizen submission to proof publication. Open and Overdue counts track grievance backlog and SLA compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BILLING & SUBSCRIPTIONS */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Current Plan Overview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {billingData?.planKey === 'office_pro' ? 'Office Pro (प्रगत)' : 'Office Basic (मूलभूत - विनामूल्य)'}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {billingData?.subscription?.status || 'Active'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">
                    {billingData?.currentPlan?.name || 'Office Basic (मूलभूत कार्यालय)'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {billingData?.currentPlan?.description || 'Free civic response tier for all statutory administrative offices.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/pricing"
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{billingData?.planKey === 'office_pro' ? 'Manage Plan' : 'Explore Office Pro'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Seats and Usage Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Active Team Seats</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {billingData?.seats?.currentMembers || 1}
                    </span>
                    <span className="text-xs text-slate-500">
                      / {billingData?.seats?.seatLimit || 5} allocated
                    </span>
                  </div>
                  {billingData?.seats?.allowed === false && (
                    <span className="text-[11px] text-amber-700 font-semibold block mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Seat limit reached
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Monthly Export Quota</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900">Always Free</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Rule 4: Unlimited office export
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Billing Currency & Mode</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-slate-900">INR (₹)</span>
                    <span className="text-xs text-slate-500">
                      • {billingData?.subscription?.billingMode === 'invoice' ? 'Govt Purchase Order' : 'Self-Serve / Free'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Tax SAC 998313 (GST compliant)
                  </span>
                </div>
              </div>
            </div>

            {/* Guaranteed Free Data Export Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-700" />
                  {t('exportOfficeData') || 'Export Office Data (CSV)'}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">
                  Non-negotiable civic guarantee: Your office's grievance response history, status timeline, and public actions are always exportable for free on every tier. Data is never locked or held hostage.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={exportLoading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{exportLoading ? 'Exporting...' : 'Download Full CSV'}</span>
              </button>
            </div>

            {/* Neutral Pro Features Notice */}
            {billingData?.planKey !== 'office_pro' && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 mb-0.5">
                    Internal workflow features on Office Pro
                  </h4>
                  <p className="text-xs text-indigo-900/90 leading-relaxed">
                    Municipal corporations and larger ward offices can subscribe to Office Pro to unlock team ticket assignment, automated breach escalation alert bots, advanced cross-ward analysis dashboards, and 25 team seats. Public citizen scorecards and complaint rankings remain strictly identical across all plans.
                  </p>
                </div>
              </div>
            )}

            {/* Invoices & Receipts Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                {t('invoicesTitle') || 'Invoices & Receipts'}
              </h4>

              {billingData?.invoices && billingData.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Amount</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {billingData.invoices.map((inv: any) => (
                        <tr key={inv._id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{inv.number}</td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {new Date(inv.issuedAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            ₹{(inv.totalPaise / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/office/${inv.officeId}/invoices/${inv._id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
                            >
                              <span>View Tax Invoice</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No paid invoices on file. Your office is operating on the free Office Basic tier.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Update Status */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-100 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 mb-1">{t('statusActionTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedIssue.title}</p>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('selectNewStatus')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusUpdate('acknowledged')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      statusUpdate === 'acknowledged'
                        ? 'border-amber-600 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionAcknowledge')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusUpdate('in_progress')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      statusUpdate === 'in_progress'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionInProgress')}
                  </button>

                  {/* Contractor cannot resolve issues directly */}
                  <button
                    type="button"
                    disabled={isContractor}
                    onClick={() => setStatusUpdate('resolved')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      isContractor
                        ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                        : statusUpdate === 'resolved'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionResolved')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusUpdate('rejected')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      statusUpdate === 'rejected'
                        ? 'border-red-600 bg-red-50 text-red-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionReject')}
                  </button>
                </div>

                {isContractor && (
                  <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {t('contractorResolvedRestriction')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('publicNoteLabel')} *
                </label>
                <textarea
                  rows={3}
                  value={officialNote}
                  onChange={(e) => setOfficialNote(e.target.value)}
                  placeholder={t('publicNotePlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Resolution Proof (Phase 2): Required when marking resolved */}
              {statusUpdate === 'resolved' && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="font-bold text-xs text-blue-950">
                      {t('afterPhotoRequiredMsg')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      {t('afterPhotoLabel')}
                    </label>
                    <input
                      type="url"
                      value={afterPhotoUrl}
                      onChange={(e) => setAfterPhotoUrl(e.target.value)}
                      placeholder="https://.../resolution_proof.jpg"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      {t('exceptionReasonLabel')}
                    </label>
                    <select
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
                    >
                      <option value="">-- {t('afterPhotoLabel')} provided --</option>
                      <option value="no_physical_work_required">{t('exceptionNoPhysicalWork')}</option>
                      <option value="administrative_action_only">{t('exceptionAdministrativeOnly')}</option>
                      <option value="duplicate_work_order">{t('exceptionDuplicateWorkOrder')}</option>
                    </select>
                  </div>
                </div>
              )}

              {statusError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                  {statusError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="w-1/3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {t('publishNoteBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Issue Colleague / Contractor Invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 mb-1">{t('inviteModalTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('inviteModalDesc')}</p>

            {generatedInviteLink ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                  <span className="font-bold block mb-1">Single-Use Link Generated:</span>
                  <code className="text-[11px] block break-all font-mono bg-white p-2 rounded border border-emerald-300">
                    {generatedInviteLink}
                  </code>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      setInviteCopied(true);
                      setTimeout(() => setInviteCopied(false), 2000);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{inviteCopied ? t('inviteUrlCopied') : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setGeneratedInviteLink('');
                    }}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                  >
                    {t('cancelBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateInvite} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('accountType')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteModalRole('official')}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        inviteModalRole === 'official' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200'
                      }`}
                    >
                      {t('officialRoleTitle')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteModalRole('agency')}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        inviteModalRole === 'agency' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-gray-200'
                      }`}
                    >
                      {t('agencyRoleTitle')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Colleague / Contractor Email</label>
                  <input
                    type="email"
                    value={inviteModalEmail}
                    onChange={(e) => setInviteModalEmail(e.target.value)}
                    placeholder="colleague@domain.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="w-1/3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    {t('generateInviteBtn')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
