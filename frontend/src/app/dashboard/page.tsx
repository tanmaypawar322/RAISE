'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import { AppShell } from '../../components/AppShell';
import { RaiseModal } from '../../components/RaiseModal';
import { NotificationPreferencesSection } from '../../components/NotificationPreferencesSection';
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
  GitMerge,
  Users,
  Vote,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';

type CitizenTab =
  | 'my_grievances'
  | 'supported_issues'
  | 'my_representatives'
  | 'townhall_activity'
  | 'notifications'
  | 'profile';

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
    mergeAccounts,
  } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<CitizenTab>('my_grievances');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [disputeModalIssue, setDisputeModalIssue] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Search & Filter for My Grievances
  const [grievanceSearch, setGrievanceSearch] = useState('');
  const [grievanceStatusFilter, setGrievanceStatusFilter] = useState<string>('all');

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

  // Account Merge state
  const [mergeMethod, setMergeMethod] = useState<'phone_otp' | 'email_password'>('phone_otp');
  const [mergePhone, setMergePhone] = useState('');
  const [mergeOtp, setMergeOtp] = useState('');
  const [mergeOtpSent, setMergeOtpSent] = useState(false);
  const [mergeEmail, setMergeEmail] = useState('');
  const [mergePassword, setMergePassword] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeMsg, setMergeMsg] = useState('');
  const [mergeError, setMergeError] = useState('');
  const [showMergeSection, setShowMergeSection] = useState(false);

  // Real data fetched from backend API
  const [myIssues, setMyIssues] = useState<any[]>([]);
  const [supportedIssues, setSupportedIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Handle URL query parameters for direct tab navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'profile') setActiveTab('profile');
      else if (tabParam === 'representatives' || tabParam === 'reps') setActiveTab('my_representatives');
      else if (tabParam === 'townhalls') setActiveTab('townhall_activity');
      else if (tabParam === 'notifications') setActiveTab('notifications');
      else if (tabParam === 'supported') setActiveTab('supported_issues');
      else if (tabParam === 'grievances' || tabParam === 'my_issues') setActiveTab('my_grievances');
    }
  }, []);

  useEffect(() => {
    if (token) {
      setLoadingIssues(true);
      Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/my-issues`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .catch(() => ({ success: false })),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/my-supported`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .catch(() => ({ success: false })),
      ])
        .then(([myRes, supRes]) => {
          if (myRes?.success && Array.isArray(myRes.issues)) {
            setMyIssues(myRes.issues);
          } else {
            setMyIssues([]);
          }
          if (supRes?.success && Array.isArray(supRes.issues)) {
            setSupportedIssues(supRes.issues);
          } else {
            setSupportedIssues([]);
          }
        })
        .finally(() => {
          setLoadingIssues(false);
        });
    } else {
      setLoadingIssues(false);
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

  const handleRequestMergeOtp = async () => {
    setMergeError('');
    setMergeMsg('');
    const digitsOnly = mergePhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      setMergeError(t('phoneInvalidMsg'));
      return;
    }
    setMergeLoading(true);
    const res = await requestPhoneOtp(`+91${digitsOnly}`, undefined, 'auth');
    setMergeLoading(false);
    if (res.success) {
      setMergeOtpSent(true);
      setMergeMsg(res.message);
    } else {
      setMergeError(res.message);
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMergeError('');
    setMergeMsg('');
    setMergeLoading(true);

    let res: { success: boolean; message?: string };
    if (mergeMethod === 'phone_otp') {
      const digitsOnly = mergePhone.replace(/\D/g, '');
      res = await mergeAccounts({
        method: 'phone_otp',
        phone: `+91${digitsOnly}`,
        otp: mergeOtp,
      });
    } else {
      res = await mergeAccounts({
        method: 'email_password',
        email: mergeEmail.trim(),
        password: mergePassword,
      });
    }
    setMergeLoading(false);

    if (res.success) {
      setMergeMsg(res.message || 'Accounts successfully merged.');
      setShowMergeSection(false);
      setMergePhone('');
      setMergeOtp('');
      setMergeEmail('');
      setMergePassword('');
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/my-issues`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => { if (d?.success) setMyIssues(d.issues || []); })
          .catch(() => {});
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/my-supported`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((d) => { if (d?.success) setSupportedIssues(d.issues || []); })
          .catch(() => {});
      }
    } else {
      setMergeError(res.message || 'Failed to merge accounts.');
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

  // Filtered grievances list
  const filteredGrievances = useMemo(() => {
    return myIssues.filter((issue) => {
      const matchSearch =
        !grievanceSearch.trim() ||
        (issue.title && issue.title.toLowerCase().includes(grievanceSearch.toLowerCase())) ||
        (issue.description && issue.description.toLowerCase().includes(grievanceSearch.toLowerCase())) ||
        (issue.location?.ward && issue.location.ward.toLowerCase().includes(grievanceSearch.toLowerCase()));

      const matchStatus =
        grievanceStatusFilter === 'all' ||
        (grievanceStatusFilter === 'open' && (issue.status === 'open' || issue.status === 'submitted')) ||
        (grievanceStatusFilter === 'in_progress' && issue.status === 'in_progress') ||
        (grievanceStatusFilter === 'resolved' && issue.status === 'resolved') ||
        (grievanceStatusFilter === 'disputed' && issue.status === 'disputed');

      return matchSearch && matchStatus;
    });
  }, [myIssues, grievanceSearch, grievanceStatusFilter]);

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
      <AppShell activeTab="my_issues">
        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-3xl border border-gray-200 text-center shadow-xs my-12">
          <Shield className="w-12 h-12 text-orange-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('myDashboard')}</h2>
          <p className="text-xs text-gray-600 mb-5">
            {t('authRequiredNotice')}
          </p>
          <button
            onClick={openAuthModal}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {t('signIn')}
          </button>
        </div>
      </AppShell>
    );
  }

  // Sidebar items definition
  const sidebarItems: { id: CitizenTab; label: string; icon: any; count?: number; badge?: string }[] = [
    {
      id: 'my_grievances',
      label: t('tabMyGrievances'),
      icon: FileText,
      count: myIssues.length,
    },
    {
      id: 'supported_issues',
      label: t('tabBackedIssues'),
      icon: ThumbsUp,
      count: supportedIssues.length,
    },
    {
      id: 'my_representatives',
      label: t('tabMyReps'),
      icon: Users,
      badge: '3 Active',
    },
    {
      id: 'townhall_activity',
      label: t('tabTownhallActivity'),
      icon: Vote,
      badge: '2 Motions',
    },
    {
      id: 'notifications',
      label: t('tabNotificationsPref'),
      icon: Bell,
    },
    {
      id: 'profile',
      label: t('tabPrivacyDpdp'),
      icon: Settings,
    },
  ];

  return (
    <AppShell activeTab="my_issues" onOpenRaiseModal={() => setIsRaiseModalOpen(true)}>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 font-extrabold flex items-center justify-center text-xl shadow-xs">
              {user.name ? user.name[0].toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Citizen Account
                </span>
                <span className="text-xs text-gray-500">{user.email || user.phoneMasked}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                {t('welcomeGreeting')} {user.name || user.displayName}
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{language === 'mr' ? 'प्रभाग १२ (निगडी - प्राधिकरण) • पिंपरी-चिंचवड' : 'Ward 12 (Nigdi - Pradhikaran) • Pimpri-Chinchwad'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRaiseModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('raiseIssueBtn')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Tab Scroller */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop 2-Column SaaS Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Persistent Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-4 sticky top-20">
            <nav className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs space-y-1">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Citizen Workspace
                </span>
              </div>

              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== undefined ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Civic Status Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-orange-900 font-bold">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>{language === 'mr' ? 'नागरी सहभाग दर्जा' : 'Civic Engagement Tier'}</span>
              </div>
              <p className="text-[11px] text-orange-800 leading-relaxed">
                {language === 'mr'
                  ? 'तुमचा प्रभाग १२ मध्ये सक्रिय सहभाग आहे. सर्व तक्रारी ७२ तासांच्या वैधानिक SLA मध्ये ट्रॅक केल्या जातात.'
                  : 'Active civic participant in Ward 12. All issues backed or reported are tracked with statutory SLA monitoring.'}
              </p>
              <div className="pt-2 border-t border-orange-200 flex items-center justify-between text-[11px] font-bold text-orange-950">
                <span>{t('raiseCountText')}</span>
                <span>{myIssues.reduce((acc, it) => acc + (it.raiseCount || 0), 0) + supportedIssues.length} Backers</span>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <section className="lg:col-span-3 space-y-6">
            {/* TAB 1: MY GRIEVANCES */}
            {activeTab === 'my_grievances' && (
              <div className="space-y-4">
                {/* Search & Status Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={grievanceSearch}
                      onChange={(e) => setGrievanceSearch(e.target.value)}
                      placeholder="Search my grievances by keyword, ward, or office..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={grievanceStatusFilter}
                      onChange={(e) => setGrievanceStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open / Submitted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="disputed">Disputed</option>
                    </select>
                  </div>
                </div>

                {loadingIssues ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-gray-500">{t('pleaseWait')}</p>
                  </div>
                ) : filteredGrievances.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-xs">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 mb-1">{t('noMyIssues')}</h3>
                    <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto leading-relaxed">
                      {t('noMyIssuesDesc')}
                    </p>
                    <button
                      onClick={() => setIsRaiseModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>{t('raiseIssueBtn')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredGrievances.map((issue) => (
                      <div
                        key={issue._id}
                        className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-orange-200 transition"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                              {t(issue.category as any) || issue.category}
                            </span>
                            <span className="text-xs text-gray-400">&bull;</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{issue.location?.ward || 'Ward 12 Nigdi'}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* SLA Badge */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>SLA: 48h Clock</span>
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                issue.status === 'resolved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : issue.status === 'disputed'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : issue.status === 'in_progress'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {issue.status === 'resolved' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : issue.status === 'disputed' ? (
                                <XCircle className="w-3 h-3 text-rose-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>
                                {issue.status === 'resolved'
                                  ? t('statusResolved')
                                  : issue.status === 'disputed'
                                  ? t('statusDisputed')
                                  : issue.status === 'in_progress'
                                  ? t('statusInProgress')
                                  : t('statusSubmitted')}
                              </span>
                            </span>
                          </div>
                        </div>

                        <h3 className="font-bold text-base text-gray-900 mb-1">{issue.title}</h3>
                        <p className="text-xs text-gray-600 mb-3 leading-relaxed">{issue.description}</p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Building className="w-3.5 h-3.5" />
                            <span className="font-medium text-gray-700">
                              {language === 'mr' && issue.office?.nameMr ? issue.office.nameMr : issue.office?.name || 'PCMC Public Works'}
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
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                                >
                                  {t('confirmResolution')}
                                </button>
                                <button
                                  onClick={() => setDisputeModalIssue(issue)}
                                  className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold text-[11px] border border-red-200 transition cursor-pointer"
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
              </div>
            )}

            {/* TAB 2: SUPPORTED ISSUES */}
            {activeTab === 'supported_issues' && (
              <div>
                {loadingIssues ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-semibold text-gray-500">{t('pleaseWait')}</p>
                  </div>
                ) : supportedIssues.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-xs">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ThumbsUp className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 mb-1">{t('noSupportedIssues')}</h3>
                    <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto leading-relaxed">
                      {t('noSupportedIssuesDesc')}
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>{t('browseFeedBtn')}</span>
                    </Link>
                  </div>
                ) : (
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
                        <p className="text-xs text-gray-600 mb-3">{issue.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span>{language === 'mr' && issue.office?.nameMr ? issue.office.nameMr : issue.office?.name}</span>
                          <span className="font-bold text-gray-800">{t('raiseCountText')}: {issue.raiseCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MY REPRESENTATIVES */}
            {activeTab === 'my_representatives' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {t('tabMyReps')}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {language === 'mr'
                          ? 'तुमच्या प्रभाग १२ (निगडी - प्राधिकरण) चे जबाबदार लोकप्रतिनिधी व त्यांची वैधानिक गुणपत्रिका'
                          : 'Statutory elected representatives representing your jurisdiction: Ward 12 (Nigdi - Pradhikaran)'}
                      </p>
                    </div>
                    <Link
                      href="/representatives"
                      className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <span>{t('viewOffices')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 3 Representative Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ward Councillor */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-orange-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-lg">
                        SC
                      </div>
                      <span className="text-[10px] bg-orange-100 text-orange-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        नगरसेवक
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Adv. Sachin Chinchwade</h3>
                      <p className="text-[11px] text-gray-500">Ward Councillor &bull; Ward 12 (Nigdi)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px]">
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">गुणपत्रिका</span>
                        <span className="font-extrabold text-orange-600">4.2 / 5.0 ★</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">तक्रार निवारण</span>
                        <span className="font-extrabold text-emerald-700">84% SLA</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                      <span className="font-bold block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-700" />
                        <span>विचारणा पाठपुरावा (72h SLA)</span>
                      </span>
                      <p className="text-[10px] text-blue-800">
                        Inquiry #W12-089 (Water Drainage) &bull; Awaiting Reply (42h left)
                      </p>
                    </div>

                    <Link
                      href="/representatives"
                      className="block text-center w-full py-2 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-800 rounded-xl text-xs font-bold transition"
                    >
                      पूर्ण गुणपत्रिका पहा
                    </Link>
                  </div>

                  {/* MLA */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg">
                        ML
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        आमदार (MLA)
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Mahesh Landge</h3>
                      <p className="text-[11px] text-gray-500">MLA &bull; Bhosari Assembly Constituency</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px]">
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">अधिवेशन हजेरी</span>
                        <span className="font-extrabold text-blue-700">91% हजेरी</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">स्थानिक निधी</span>
                        <span className="font-extrabold text-emerald-700">₹ 4.2 कोटी</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700">
                      <span className="font-bold block">विधीमंडळ प्रश्न</span>
                      <span className="text-[10px] text-gray-500">14 तारांकित प्रश्न उपस्थित</span>
                    </div>

                    <Link
                      href="/representatives"
                      className="block text-center w-full py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-800 rounded-xl text-xs font-bold transition"
                    >
                      पूर्ण गुणपत्रिका पहा
                    </Link>
                  </div>

                  {/* MP */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-purple-300 transition">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                        SB
                      </div>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        खासदार (MP)
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">Shrirang Barne</h3>
                      <p className="text-[11px] text-gray-500">MP &bull; Maval Parliamentary Constituency</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px]">
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">संसद हजेरी</span>
                        <span className="font-extrabold text-purple-700">86% हजेरी</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">MPLADS खर्च</span>
                        <span className="font-extrabold text-emerald-700">92% खर्च</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-700">
                      <span className="font-bold block">लोकसभा वादविवाद</span>
                      <span className="text-[10px] text-gray-500">28 राष्ट्रीय व स्थानिक चर्चा</span>
                    </div>

                    <Link
                      href="/representatives"
                      className="block text-center w-full py-2 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-800 rounded-xl text-xs font-bold transition"
                    >
                      पूर्ण गुणपत्रिका पहा
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TOWNHALL ACTIVITY */}
            {activeTab === 'townhall_activity' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{t('tabTownhallActivity')}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      डिजिटल ग्रामसभा व सामूहिक निर्णय प्रक्रियेमधील तुमचा सहभाग आणि मतदान नोंदी
                    </p>
                  </div>
                  <Link
                    href="/townhalls"
                    className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    <span>सर्व ग्रामसभा पहा</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {/* Motion 1 */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        मतदान सुरू (Active Motion)
                      </span>
                      <span className="text-xs text-gray-400 font-medium">मुदत: ४ दिवस शिल्लक</span>
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900">
                      प्रभाग १२ रस्ते डांबरीकरण व पावसाळी निचरा कृती आराखडा २०२६-२७
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      प्राधिकरण परिसरातील अंतर्गत रस्त्यांचे १००% खड्डेमुक्त डांबरीकरण आणि पावसाळ्यात पाणी साचू नये म्हणून स्टॉर्म वॉटर ड्रेनेज क्षमता वाढवणे.
                    </p>
                    <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700">सहमत: १४२ नागरिक</span>
                        <span className="text-gray-300">&bull;</span>
                        <span className="font-bold text-rose-700">असहमत: १८ नागरिक</span>
                      </div>
                      <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                        तुमचे मत: सहमत ✓
                      </span>
                    </div>
                  </div>

                  {/* Motion 2 */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        मंजूर ठराव (Resolution Passed)
                      </span>
                      <span className="text-xs text-gray-400 font-medium">PCMC विद्युत विभागास आदेशित</span>
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900">
                      सार्वजनिक उद्यानांमध्ये सौरऊर्जा दिवे व सुरक्षितता सीसीटीव्ही बसवणे
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      निगडी प्राधिकरण भागातील ४ प्रमुख उद्यानांमध्ये महिला व ज्येष्ठ नागरिकांच्या सुरक्षिततेसाठी सौरऊर्जा पथदिवे व सीसीटीव्ही यंत्रणा मंजूर करण्यात आली.
                    </p>
                    <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700">८९% नागरिकांच्या बहुमताने मंजूर</span>
                      <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md text-[11px]">
                        १ सुधारणा मांडली (Amendment)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <NotificationPreferencesSection />
              </div>
            )}

            {/* TAB 6: PROFILE & DPDP PRIVACY */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs max-w-2xl">
                <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span>{t('profileSettingsTab')}</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    DPDP Act 2023 Compliant
                  </span>
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

                  {/* Linked Credentials & Account Merging */}
                  <div className="mt-6 pt-5 border-t border-gray-200 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <GitMerge className="w-4 h-4 text-orange-600" />
                        <h3 className="font-bold text-sm text-gray-900">{t('accountLinkingTitle')}</h3>
                      </div>
                      {!showMergeSection && (
                        <button
                          type="button"
                          onClick={() => setShowMergeSection(true)}
                          className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          {t('mergeAccountsBtn')}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">{t('accountLinkingDesc')}</p>

                    {mergeError && (
                      <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-xl text-[11px] text-red-800 font-medium">
                        {mergeError}
                      </div>
                    )}
                    {mergeMsg && (
                      <div className="mb-3 p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-[11px] text-emerald-800 font-medium">
                        {mergeMsg}
                      </div>
                    )}

                    {showMergeSection && (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                          {t('mergeWarningNotice')}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                            {t('mergeMethodLabel')}
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMergeMethod('phone_otp');
                                setMergeOtpSent(false);
                                setMergeError('');
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                mergeMethod === 'phone_otp'
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {t('mergePhoneOtp')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMergeMethod('email_password');
                                setMergeOtpSent(false);
                                setMergeError('');
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                mergeMethod === 'email_password'
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {t('mergeEmailPassword')}
                            </button>
                          </div>
                        </div>

                        {mergeMethod === 'phone_otp' ? (
                          <div className="space-y-3">
                            {!mergeOtpSent ? (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-600">🇮🇳 +91</span>
                                  <input
                                    type="tel"
                                    value={mergePhone}
                                    onChange={(e) => setMergePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="98765 43210"
                                    className="w-full pl-16 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRequestMergeOtp}
                                  disabled={mergeLoading || mergePhone.length < 10}
                                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                  {mergeLoading ? t('pleaseWait') : t('sendOtp')}
                                </button>
                              </div>
                            ) : (
                              <form onSubmit={handleMergeSubmit} className="space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                    {t('step2OtpSubtitle')} +91 {mergePhone}
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={6}
                                    value={mergeOtp}
                                    onChange={(e) => setMergeOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    className="w-full text-center tracking-widest px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    required
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMergeOtpSent(false);
                                      setMergeOtp('');
                                    }}
                                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                  >
                                    {t('cancelBtn')}
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={mergeLoading || mergeOtp.length !== 6}
                                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                  >
                                    {mergeLoading ? t('pleaseWait') : t('confirmMergeBtn')}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        ) : (
                          <form onSubmit={handleMergeSubmit} className="space-y-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                {t('email')}
                              </label>
                              <input
                                type="email"
                                value={mergeEmail}
                                onChange={(e) => setMergeEmail(e.target.value)}
                                placeholder="secondary@example.com"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                {t('currentPasswordLabel')}
                              </label>
                              <input
                                type="password"
                                value={mergePassword}
                                onChange={(e) => setMergePassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowMergeSection(false);
                                  setMergeEmail('');
                                  setMergePassword('');
                                }}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                {t('cancelBtn')}
                              </button>
                              <button
                                type="submit"
                                disabled={mergeLoading || !mergeEmail || !mergePassword}
                                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                              >
                                {mergeLoading ? t('pleaseWait') : t('confirmMergeBtn')}
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
          </section>
        </div>
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
                  className="w-1/2 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t('disputeSubmitBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
