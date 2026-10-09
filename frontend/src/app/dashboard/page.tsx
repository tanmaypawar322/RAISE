'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { RaiseModal } from '../../components/RaiseModal';
import {
  FileText,
  ThumbsUp,
  Settings,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Shield,
  ArrowLeft,
  MapPin,
  XCircle,
  Trash2,
  Download,
} from 'lucide-react';

export default function CitizenDashboardPage() {
  const {
    user,
    token,
    isInitializing,
    openAuthModal,
    deleteAccount,
    requestPhoneOtp,
    changePassword,
    addVerifiedPhone,
  } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'my_issues' | 'supported' | 'profile'>('my_issues');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [disputeModalIssue, setDisputeModalIssue] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Account deletion state (DPDP Act 2023)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);

  // Download Data state (DPDP Act 2023)
  const [downloadingData, setDownloadingData] = useState(false);
  const [downloadDataError, setDownloadDataError] = useState<string | null>(null);
  const [downloadDataSuccess, setDownloadDataSuccess] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  // Add Verified Phone state
  const [attachPhone, setAttachPhone] = useState('');
  const [attachOtp, setAttachOtp] = useState('');
  const [attachOtpSent, setAttachOtpSent] = useState(false);
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachMsg, setAttachMsg] = useState('');
  const [attachError, setAttachError] = useState('');

  // Sample data (populated from backend API if online)
  const [myIssues, setMyIssues] = useState<any[]>([
    {
      _id: 'my_1',
      title: 'Dangerous Potholes and Waterlogging in front of Akurdi Station',
      titleMr: 'आकुर्डी रेल्वे स्टेशन समोरील रस्त्यावर धोकादायक खड्डे व तुंबलेले पाणी',
      description: 'Road has collapsed for 2 weeks due to rain. Two-wheelers are skidding and multiple commuters injured.',
      descriptionMr: 'पावसामुळे २ आठवड्यांपासून स्टेशन समोरील रस्ता खचला आहे. दुचाकी घसरून अनेक नागरिक जखमी झाले आहेत.',
      category: 'roads',
      office: { name: 'PCMC Road Maintenance Department', nameMr: 'पिं.चिं.म.न.पा. रस्ते देखभाल विभाग' },
      status: 'submitted',
      raiseCount: 84,
      createdAt: '2026-10-05T08:30:00.000Z',
    },
    {
      _id: 'my_2',
      title: 'Low-Pressure Turbid Water Supply in Nigdi Sector 24',
      titleMr: 'निगडी सेक्टर २४ मध्ये कमी दाबाने गढूळ पाण्याचा पुरवठा',
      description: 'Water arrives for only 15 minutes in the morning at very low pressure. Requires line inspection and pressure restoration.',
      descriptionMr: 'सकाळी फक्त १५ मिनिटे कमी दाबाने पाणी येते. दुरुस्ती व दाबाची पाहणी करावी.',
      category: 'water',
      office: { name: 'PCMC Water Supply Department', nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा विभाग' },
      status: 'resolved',
      raiseCount: 142,
      createdAt: '2026-10-03T11:00:00.000Z',
    },
  ]);

  const [supportedIssues, setSupportedIssues] = useState<any[]>([
    {
      _id: 'sup_1',
      title: 'Garbage Accumulation and Foul Odour near Chinchwad Vegetable Market',
      titleMr: 'चिंचवड भाजी मंडई जवळ कचऱ्याचे ढीग व दुर्गंधी',
      category: 'sanitation',
      office: { name: 'PCMC Health & Sanitation', nameMr: 'पिं.चिं.म.न.पा. आरोग्य विभाग' },
      status: 'in_progress',
      raiseCount: 67,
      createdAt: '2026-10-06T14:15:00.000Z',
    },
  ]);

  useEffect(() => {
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/my-issues`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.issues?.length > 0) {
            setMyIssues(data.issues);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleConfirmResolution = async (issueId: string) => {
    setMyIssues((prev) =>
      prev.map((it) => (it._id === issueId ? { ...it, status: 'resolved', isConfirmed: true } : it))
    );
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${issueId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalIssue) return;

    setMyIssues((prev) =>
      prev.map((it) => (it._id === disputeModalIssue._id ? { ...it, status: 'disputed' } : it))
    );

    if (token) {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${disputeModalIssue._id}/dispute`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: disputeReason }),
        }
      ).catch(() => {});
    }

    setDisputeModalIssue(null);
    setDisputeReason('');
  };

  const handleRequestDeleteOtp = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    const rawTarget = user?.phoneMasked || user?.email || '';
    const res = await requestPhoneOtp(rawTarget, undefined, 'delete_account');
    setDeleteLoading(false);
    if (res.success) {
      setDeleteOtpSent(true);
    } else {
      setDeleteError(res.message);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError('');
    const res = await deleteAccount({
      password: deletePassword || undefined,
      otp: deleteOtp || undefined,
    });
    setDeleteLoading(false);
    if (res.success) {
      alert(t('accountDeletedSuccess'));
      window.location.href = '/';
    } else {
      setDeleteError(res.message || 'Failed to delete account.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordMsg('');
    if (newPassword.length < 10) {
      setChangePasswordError(t('passwordPlaceholder'));
      return;
    }
    setChangePasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setChangePasswordLoading(false);
    if (res.success) {
      setChangePasswordMsg(t('passwordChangedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setChangePasswordError(res.message || 'Failed to change password');
    }
  };

  const handleRequestAttachPhoneOtp = async () => {
    setAttachError('');
    setAttachMsg('');
    const digitsOnly = attachPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setAttachError(t('phoneInvalidMsg'));
      return;
    }
    setAttachLoading(true);
    const res = await requestPhoneOtp(`+91${digitsOnly}`, undefined, 'add_phone');
    setAttachLoading(false);
    if (res.success) {
      setAttachOtpSent(true);
      setAttachMsg(res.message);
    } else {
      setAttachError(res.message);
    }
  };

  const handleAttachPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttachError('');
    setAttachMsg('');
    const digitsOnly = attachPhone.replace(/\D/g, '');
    setAttachLoading(true);
    const res = await addVerifiedPhone(`+91${digitsOnly}`, attachOtp);
    setAttachLoading(false);
    if (res.success) {
      setAttachMsg(t('phoneAttachedSuccess'));
      setAttachPhone('');
      setAttachOtp('');
      setAttachOtpSent(false);
    } else {
      setAttachError(res.message || 'Failed to attach phone');
    }
  };

  const handleDownloadData = async () => {
    try {
      setDownloadingData(true);
      setDownloadDataError(null);
      setDownloadDataSuccess(false);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/export-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to download data');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raise-my-data-${user?.id || 'export'}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadDataSuccess(true);
    } catch (err: any) {
      setDownloadDataError(err.message || 'Error downloading data');
    } finally {
      setDownloadingData(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-600">{t('sessionInitializing')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-3xl border border-gray-200 text-center shadow-xs">
          <Shield className="w-12 h-12 text-orange-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('myDashboard')}</h2>
          <p className="text-xs text-gray-600 mb-5">
            {t('authRequiredNotice')}
          </p>
          <button
            onClick={openAuthModal}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition"
          >
            {t('signIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* User Greeting & Stats Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                Citizen Account
              </span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {t('welcomeGreeting')} {user.name || user.displayName}
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{language === 'mr' ? 'प्रभाग १२ • पिंपरी-चिंचवड, पुणे' : 'Ward 12 • Pimpri-Chinchwad, Pune'}</span>
            </p>
          </div>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('raiseIssueBtn')}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('my_issues')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'my_issues'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('myIssuesTab')} ({myIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('supported')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'supported'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{t('supportedIssuesTab')} ({supportedIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'profile'
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t('profileSettingsTab')}</span>
          </button>
        </div>

        {/* Tab 1: MY ISSUES */}
        {activeTab === 'my_issues' && (
          <div className="space-y-4">
            {myIssues.map((issue) => (
              <div key={issue._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    {t(issue.category as any) || issue.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      issue.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : issue.status === 'disputed'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {issue.status === 'resolved'
                        ? t('statusResolved')
                        : issue.status === 'disputed'
                        ? t('statusDisputed')
                        : t('statusSubmitted')}
                    </span>
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900 mb-1">{issue.title}</h3>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{issue.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Building className="w-3.5 h-3.5" />
                    <span className="font-medium text-gray-700">
                      {language === 'mr' && issue.office?.nameMr ? issue.office.nameMr : issue.office?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                      👥 {issue.raiseCount} {t('raiseCountText')}
                    </span>

                    {/* Dispute & Confirm on Resolved items */}
                    {issue.status === 'resolved' && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => handleConfirmResolution(issue._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                        >
                          {t('confirmResolution')}
                        </button>
                        <button
                          onClick={() => setDisputeModalIssue(issue)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-[11px] border border-red-200 transition"
                        >
                          {t('disputeResolution')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: SUPPORTED ISSUES */}
        {activeTab === 'supported' && (
          <div className="space-y-4">
            {supportedIssues.map((issue) => (
              <div key={issue._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    {t(issue.category as any) || issue.category}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {t('citizenBackedBadge')}
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-1">
                  {language === 'mr' && issue.titleMr ? issue.titleMr : issue.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span>{language === 'mr' && issue.office?.nameMr ? issue.office.nameMr : issue.office?.name}</span>
                  <span className="font-bold text-gray-800">{t('raiseCountText')}: {issue.raiseCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: PROFILE & PRIVACY */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs max-w-xl">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {t('profileSettingsTab')}
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 font-semibold mb-1">{t('fullName')}:</label>
                <div className="font-bold text-sm text-gray-900">{user.name}</div>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">{t('email')}:</label>
                <div className="font-bold text-sm text-gray-900">{user.email}</div>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">{t('optionalPhone')}:</label>
                <div className="font-bold text-sm text-gray-900">{user.phoneMasked || t('phoneNotProvided')}</div>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <span className="font-bold text-orange-900 block mb-0.5">{t('privacyGuaranteeTitle')}</span>
                <span className="text-orange-800 text-[11px]">
                  {t('privacyGuaranteeText')}
                </span>
              </div>

              {/* Change Password */}
              <div className="mt-6 pt-5 border-t border-gray-200 text-left">
                <h3 className="font-bold text-sm text-gray-900 mb-2">{t('changePasswordTitle')}</h3>
                {changePasswordError && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-xl text-[11px] text-red-800 font-medium">
                    {changePasswordError}
                  </div>
                )}
                {changePasswordMsg && (
                  <div className="mb-3 p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-[11px] text-emerald-800 font-medium">
                    {changePasswordMsg}
                  </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {t('currentPasswordLabel')}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {t('newPasswordLabel')} ({t('passwordPlaceholder')})
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      minLength={10}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changePasswordLoading || !currentPassword || newPassword.length < 10}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {changePasswordLoading ? t('pleaseWait') : t('changePasswordBtn')}
                  </button>
                </form>
              </div>

              {/* Add / Attach Verified Phone */}
              <div className="mt-6 pt-5 border-t border-gray-200 text-left">
                <h3 className="font-bold text-sm text-gray-900 mb-1">{t('addPhoneTitle')}</h3>
                <p className="text-[11px] text-gray-500 mb-3">{t('addPhoneDesc')}</p>
                {attachError && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-xl text-[11px] text-red-800 font-medium">
                    {attachError}
                  </div>
                )}
                {attachMsg && (
                  <div className="mb-3 p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-[11px] text-emerald-800 font-medium">
                    {attachMsg}
                  </div>
                )}

                {user.phoneMasked ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block">Verified Mobile Number</span>
                      <span>{user.phoneMasked}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                      Linked ✓
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!attachOtpSent ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-xs font-bold text-gray-600">🇮🇳 +91</span>
                          <input
                            type="tel"
                            value={attachPhone}
                            onChange={(e) => setAttachPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="98765 43210"
                            className="w-full pl-16 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRequestAttachPhoneOtp}
                          disabled={attachLoading || attachPhone.length < 10}
                          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                        >
                          {attachLoading ? t('pleaseWait') : t('sendOtp')}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAttachPhoneSubmit} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            {t('step2OtpSubtitle')} +91 {attachPhone}
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={attachOtp}
                            onChange={(e) => setAttachOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="w-full text-center tracking-widest px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAttachOtpSent(false);
                              setAttachOtp('');
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            {t('cancelBtn')}
                          </button>
                          <button
                            type="submit"
                            disabled={attachLoading || attachOtp.length !== 6}
                            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                          >
                            {attachLoading ? t('pleaseWait') : t('attachPhoneBtn')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* DPDP Act 2023 Right to Access & Data Portability */}
              <div className="mt-6 pt-5 border-t border-gray-200">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-sm text-emerald-950">{t('downloadDataTitle')}</h3>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mb-4">
                    {t('downloadDataDesc')}
                  </p>

                  {downloadDataError && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-xl text-[11px] text-red-800 font-medium">
                      {downloadDataError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadData}
                    disabled={downloadingData}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingData ? t('downloadingData') : t('downloadDataBtn')}</span>
                  </button>
                </div>
              </div>

              {/* DPDP Act 2023 Self-Serve Account Deletion */}
              <div className="mt-6 pt-5 border-t border-gray-200">
                <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200 text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <h3 className="font-bold text-sm text-red-950">{t('deleteAccountTitle')}</h3>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed mb-4">
                    {t('deleteAccountDesc')}
                  </p>

                  {deleteError && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-xl text-[11px] text-red-800 font-medium">
                      {deleteError}
                    </div>
                  )}

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('deleteAccountBtn')}</span>
                    </button>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="space-y-3 pt-2 border-t border-red-200/60">
                      {user.email && !user.phoneMasked ? (
                        <div>
                          <label className="block text-[11px] font-bold text-red-900 mb-1">
                            {t('enterDeletePassword')}
                          </label>
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {!deleteOtpSent ? (
                            <button
                              type="button"
                              onClick={handleRequestDeleteOtp}
                              disabled={deleteLoading}
                              className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                            >
                              {deleteLoading ? t('pleaseWait') : t('requestDeleteOtpBtn')}
                            </button>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-red-900 mb-1">
                                {t('enterDeleteOtp')}
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                value={deleteOtp}
                                onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                className="w-full text-center tracking-widest px-3 py-2 bg-white border border-red-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                                required
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteOtpSent(false);
                            setDeleteError('');
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {t('cancelBtn')}
                        </button>
                        <button
                          type="submit"
                          disabled={deleteLoading || (!deletePassword && !deleteOtp)}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          {deleteLoading ? t('pleaseWait') : t('deleteAccountBtn')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Raise Issue Modal */}
      <RaiseModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onIssueCreated={(newIt) => setMyIssues((prev) => [newIt, ...prev])}
      />

      {/* Dispute Modal */}
      {disputeModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 mb-2">
              {t('disputeModalTitle')}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              {t('disputeModalSubtitle')}
            </p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={t('publicNotePlaceholder')}
                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalIssue(null)}
                  className="w-1/2 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  {t('disputeSubmitBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
