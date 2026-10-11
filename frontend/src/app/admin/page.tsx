'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import {
  ShieldAlert,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Flame,
  FileText,
  Clock,
  Check,
  ShieldCheck,
  KeyRound,
  Lock,
  Download,
  LogOut,
  MapPin,
  Layers,
  GitMerge,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Scale,
  CreditCard,
  Wallet,
} from 'lucide-react';

const PILOT_WARD_METRICS = [
  { id: 'Ward 12 (Nigdi - Pradhikaran)', name: 'Ward 12 (Nigdi)', nameMr: 'प्रभाग १२ (निगडी)', nameHi: 'वार्ड १२ (निगडी)', total: 42, open: 15, resolved: 24, overdue: 3 },
  { id: 'Ward 10 (Akurdi)', name: 'Ward 10 (Akurdi)', nameMr: 'प्रभाग १० (आकुर्डी)', nameHi: 'वार्ड १० (आकुर्डी)', total: 28, open: 9, resolved: 17, overdue: 2 },
  { id: 'Ward 18 (Chinchwad Station)', name: 'Ward 18 (Chinchwad)', nameMr: 'प्रभाग १८ (चिंचवड)', nameHi: 'वार्ड १८ (चिंचवड)', total: 19, open: 7, resolved: 11, overdue: 1 },
  { id: 'Ward 22 (Pimpri Market)', name: 'Ward 22 (Pimpri)', nameMr: 'प्रभाग २२ (पिंपरी)', nameHi: 'वार्ड २२ (पिंपरी)', total: 14, open: 4, resolved: 10, overdue: 0 },
  { id: 'Ward 8 (Bhosari)', name: 'Ward 8 (Bhosari)', nameMr: 'प्रभाग ८ (भोसरी)', nameHi: 'वार्ड ८ (भोसरी)', total: 11, open: 5, resolved: 6, overdue: 0 },
];

const PILOT_CATEGORY_METRICS: Array<{ id: string; key: 'roads' | 'water' | 'sanitation' | 'health' | 'electricity' | 'education' | 'other'; total: number; open: number; resolved: number; overdue: number }> = [
  { id: 'roads', key: 'roads', total: 38, open: 14, resolved: 21, overdue: 3 },
  { id: 'water', key: 'water', total: 31, open: 10, resolved: 19, overdue: 2 },
  { id: 'sanitation', key: 'sanitation', total: 24, open: 7, resolved: 16, overdue: 1 },
  { id: 'health', key: 'health', total: 9, open: 3, resolved: 6, overdue: 0 },
  { id: 'electricity', key: 'electricity', total: 7, open: 3, resolved: 4, overdue: 0 },
  { id: 'education', key: 'education', total: 3, open: 2, resolved: 1, overdue: 0 },
  { id: 'other', key: 'other', total: 2, open: 1, resolved: 1, overdue: 0 },
];

export default function AdminPanelPage() {
  const {
    user,
    token,
    isInitializing,
    loginWithCredentials,
    verify2FaLogin,
    setup2Fa,
    verify2FaSetup,
    disable2Fa,
    logoutAll,
  } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'claims' | 'moderation' | 'escalation' | 'security' | 'jurisdictions' | 'metrics'>('claims');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unclaimedProfiles, setUnclaimedProfiles] = useState<any[]>([]);
  const [selectedLinkProfileMap, setSelectedLinkProfileMap] = useState<Record<string, string>>({});

  // Pilot Metrics State (Phase 7)
  const [pilotMetrics, setPilotMetrics] = useState<any | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Jurisdictions & Routing state
  const [jurisdictionsList, setJurisdictionsList] = useState<any[]>([]);
  const [officesList, setOfficesList] = useState<any[]>([]);
  const [jurisdictionsLoading, setJurisdictionsLoading] = useState(false);
  const [escalationRunning, setEscalationRunning] = useState(false);
  const [escalationToast, setEscalationToast] = useState<string | null>(null);

  // Issue Merge Tool State (Phase 2)
  const [canonicalMergeId, setCanonicalMergeId] = useState('');
  const [duplicateMergeIds, setDuplicateMergeIds] = useState('');
  const [mergeResultToast, setMergeResultToast] = useState<string | null>(null);
  const [unmergeId, setUnmergeId] = useState('');

  // Admin portal inline auth state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [isPublicComputer, setIsPublicComputer] = useState(false);

  // 2FA login challenge state
  const [require2FaChallenge, setRequire2FaChallenge] = useState(false);
  const [temp2FaToken, setTemp2FaToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // 2FA setup modal state
  const [show2FaSetupModal, setShow2FaSetupModal] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupUri, setSetupUri] = useState('');
  const [setupBackupCodes, setSetupBackupCodes] = useState<string[]>([]);
  const [setupVerifyCode, setSetupVerifyCode] = useState('');
  const [setup2FaLoading, setSetup2FaLoading] = useState(false);
  const [setup2FaError, setSetup2FaError] = useState('');
  const [setup2FaSuccess, setSetup2FaSuccess] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Real claims queue
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  // Platform Stats
  const [stats, setStats] = useState({
    activeCitizens: 142,
    pendingClaims: 0,
    flaggedReports: 1,
    overdueEscalations: 1,
  });

  // Flagged reports
  const [flaggedReports, setFlaggedReports] = useState<any[]>([
    {
      _id: 'flag_1',
      targetTitle: 'Unpermitted highway blockade threat during rush hour',
      targetTitleMr: 'रस्त्यावर आंदोलन आणि रस्ता रोको करण्याचा इशारा',
      reportedBy: 'Citizen #8921',
      reason: 'violence',
      details: 'Provocative language and threat to obstruct essential public transport.',
      detailsMr: 'प्रक्षोभक भाषेचा वापर आणि सार्वजनिक वाहतूक रोखण्याची धमकी.',
      status: 'pending',
    },
  ]);

  // Escalations
  const [escalations, setEscalations] = useState<any[]>([
    {
      _id: 'esc_1',
      issueTitle: 'Dangerous potholes and waterlogging outside Akurdi Railway Station',
      issueTitleMr: 'आकुर्डी रेल्वे स्टेशन समोरील रस्त्यावर धोकादायक खड्डे व तुंबलेले पाणी',
      officeName: 'PCMC Road Maintenance & Civil Department',
      locality: 'Ward 10 (Akurdi), Pimpri-Chinchwad',
      daysPast: 3,
      raiseCount: 84,
      cpgramsDraft:
        `To,\nPublic Grievance Officer, PCMC & Govt of Maharashtra\n\n` +
        `Subject: Non-action on public civic grievance: Akurdi Station Potholes\n\n` +
        `Sir/Madam,\n` +
        `The citizens of Ward 10 (Akurdi) submitted a serious road safety grievance to PCMC Road Maintenance Dept.\n` +
        `Despite 3 days and 84 citizen backers, no action has been taken.\n` +
        `Requesting immediate on-site inspection.\n\n` +
        `Regards,\nRAISE Citizen Collective`,
      rtiDraft:
        `APPLICATION UNDER SECTION 6(1) OF RIGHT TO INFORMATION ACT, 2005\n\n` +
        `To,\nThe Public Information Officer (PIO),\nPCMC Road Maintenance Department\n\n` +
        `1. Certified copy of Action Taken Report on grievance regarding "Akurdi Station Road Potholes".\n` +
        `2. Name and designation of Junior Engineer responsible for this beat.\n` +
        `3. Total road repair funds allocated to Ward 10 for FY 2026-27.\n\n` +
        `Applicant: Citizen of India via RAISE Transparency Portal`,
    },
  ]);

  // Fetch real claims from backend
  const fetchClaims = async () => {
    if (!token) return;
    setClaimsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.claims) {
        setClaimsList(data.claims);
        if (data.unclaimedProfiles) {
          setUnclaimedProfiles(data.unclaimedProfiles);
        }
        setStats((prev) => ({ ...prev, pendingClaims: data.claims.filter((c: any) => c.status === 'pending').length }));
      }
    } catch {
      // Fallback sample claims
      setClaimsList([
        {
          _id: 'claim_sample_1',
          officeId: { name: 'PCMC Road Maintenance & Civil Department' },
          userId: { displayName: 'Rajesh Patil', phoneMasked: '+91 ******3210', email: 'rajesh.patil@pcmc.gov.in' },
          role: 'official',
          designation: 'Junior Engineer (Civil)',
          employeeId: 'PCMC-ENG-491',
          workEmail: 'rajesh.patil@pcmc.gov.in',
          status: 'pending',
          claimNotes: 'Assigned to Ward 10 road maintenance beat.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setClaimsLoading(false);
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch {
      // Ignore
    }
  };

  const fetchJurisdictions = async () => {
    if (!token) return;
    setJurisdictionsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/jurisdictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setJurisdictionsList(data.jurisdictions || []);
        setOfficesList(data.offices || []);
      }
    } catch {
      // Ignore
    } finally {
      setJurisdictionsLoading(false);
    }
  };

  const handleRunEscalations = async () => {
    if (!token || escalationRunning) return;
    setEscalationRunning(true);
    setEscalationToast(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/escalations/run-now`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setEscalationToast(`${t('escalationCheckSuccess')}: ${data.checkedCount ?? 0} checked, ${data.escalatedCount ?? 0} escalated.`);
      } else {
        setEscalationToast(data.message || 'Escalation check failed.');
      }
    } catch {
      setEscalationToast('Failed to run escalation check.');
    } finally {
      setEscalationRunning(false);
    }
  };

  const fetchPilotMetrics = async () => {
    if (!token) return;
    setMetricsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setPilotMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch pilot metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!token) return;
    setDownloadingCsv(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/metrics/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to download CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raise-pilot-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error downloading standup CSV report.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `name,nameMr,nameHi,level,department,jurisdictionName,supportedCategories,slaHoursRoads,slaHoursWater,slaHoursSanitation,slaHoursDefault,officialEmail,escalatesToOfficeName
"PCMC Ward 12 Citizen Civic Cell","पिं.चिं.म.न.पा. प्रभाग १२ नागरी सेवा केंद्र","पिं.चिं.म.न.पा. वार्ड १२ नागरिक सेवा केंद्र",ward,general,"PCMC Ward 12 (Nigdi - Pradhikaran)","roads,water,sanitation,health,electricity",72,48,24,48,ward12.cell@pcmc.gov.in,"PCMC Ward 'A' Zonal Office"
"PCMC Ward 12 Sanitation & Waste Wing","पिं.चिं.म.न.पा. प्रभाग १२ स्वच्छता व आरोग्य शाखा","पिं.चिं.म.न.पा. वार्ड १२ स्वच्छता व स्वास्थ्य शाखा",ward,sanitation,"PCMC Ward 12 (Nigdi - Pradhikaran)","sanitation",72,48,24,24,sanitation.w12@pcmc.gov.in,"PCMC Ward 'A' Zonal Office"
"PCMC Ward 'A' Zonal Office","पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय","पिं.चिं.म.न.पा. 'अ' जोनल कार्यालय",ward,general,"PCMC Zone A (Pradhikaran - Akurdi)","roads,water,sanitation,health,electricity",72,48,48,48,zonal.a@pcmc.gov.in,"PCMC Central Grievance Redressal Cell"
"PCMC Water Supply & Drainage Department","पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग","पिं.चिं.म.न.पा. जल आपूर्ति एवं जल निकासी विभाग",corporation,water,"PCMC Central Headquarters","water",72,24,48,24,officer.water@pcmc.gov.in,"PCMC Central Grievance Redressal Cell"
"PCMC Road Maintenance & Civil Department","पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग","पिं.चिं.म.न.पा. सड़क एवं सिविल रखरखाव विभाग",corporation,roads,"PCMC Central Headquarters","roads",72,48,48,72,officer.roads@pcmc.gov.in,"PCMC Central Grievance Redressal Cell"
"PCMC Central Grievance Redressal Cell","पिं.चिं.म.न.पा. मध्यवर्ती तक्रार निवारण कक्ष (मुख्यालय)","पिं.चिं.म.न.पा. केंद्रीय शिकायत निवारण प्रकोष्ठ",corporation,general,"PCMC Central Headquarters","roads,water,sanitation,health,education,electricity,general",48,24,24,48,grievance.hq@pcmc.gov.in,""`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'offices-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !canonicalMergeId.trim() || !duplicateMergeIds.trim()) return;
    const dups = duplicateMergeIds.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${canonicalMergeId.trim()}/merge`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duplicateIssueIds: dups }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMergeResultToast(data.message || t('mergeSuccessMsg'));
        setCanonicalMergeId('');
        setDuplicateMergeIds('');
      } else {
        setMergeResultToast(data.message || 'Merge failed');
      }
    } catch {
      setMergeResultToast('Network error during issue merge.');
    }
  };

  const handleUnmergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !unmergeId.trim()) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${unmergeId.trim()}/unmerge`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setMergeResultToast(data.message || 'Issue successfully unmerged.');
        setUnmergeId('');
      } else {
        setMergeResultToast(data.message || 'Unmerge failed');
      }
    } catch {
      setMergeResultToast('Network error during issue unmerge.');
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin' && token) {
      fetchClaims();
      fetchStats();
      if (activeTab === 'jurisdictions') {
        fetchJurisdictions();
      } else if (activeTab === 'metrics') {
        fetchPilotMetrics();
      }
    }
  }, [user, token, activeTab]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    const res = await loginWithCredentials(adminEmail, adminPassword, isPublicComputer);
    setAdminLoading(false);

    if (res.require2Fa) {
      setRequire2FaChallenge(true);
      setTemp2FaToken(res.tempToken || '');
      return;
    }

    if (!res.success) {
      setAdminError(res.message || t('invalidCredentialsMsg'));
    }
  };

  const handle2FaLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);
    const res = await verify2FaLogin(temp2FaToken, totpCode, isPublicComputer);
    setAdminLoading(false);
    if (!res.success) {
      setAdminError(res.message || t('invalidCredentialsMsg'));
    } else {
      setRequire2FaChallenge(false);
    }
  };

  const handleApproveClaim = async (claimId: string, linkProfileId?: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/claims/${claimId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ linkProfileId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setClaimsList((prev) =>
          prev.map((c) => (c._id === claimId ? { ...c, status: 'approved' } : c))
        );
      } else {
        alert(data.message || 'Failed to approve claim.');
      }
    } catch {
      alert('Network error while approving claim.');
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    const reason = prompt(t('rejectionReasonPrompt'), 'Credentials could not be verified with official municipal rolls.');
    if (!reason || !token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/claims/${claimId}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setClaimsList((prev) =>
          prev.map((c) => (c._id === claimId ? { ...c, status: 'rejected', rejectionReason: reason } : c))
        );
      }
    } catch {
      alert('Network error while rejecting claim.');
    }
  };

  const handleRequestInfo = async (claimId: string) => {
    const notes = prompt(t('needsInfoPrompt'), 'Please provide a copy of your official appointment order or contractor work order.');
    if (!notes || !token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/claims/${claimId}/request-info`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setClaimsList((prev) =>
          prev.map((c) => (c._id === claimId ? { ...c, status: 'needs_info', adminNotes: notes } : c))
        );
      }
    } catch {
      alert('Network error.');
    }
  };

  const handleStart2FaSetup = async () => {
    setSetup2FaError('');
    setSetup2FaLoading(true);
    const res = await setup2Fa();
    setSetup2FaLoading(false);
    if (res.success) {
      setSetupSecret(res.secret || '');
      setSetupUri(res.otpAuthUri || '');
      setSetupBackupCodes(res.backupCodes || []);
      setShow2FaSetupModal(true);
    } else {
      alert(res.message || 'Failed to start 2FA setup.');
    }
  };

  const handleConfirm2FaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetup2FaError('');
    setSetup2FaLoading(true);
    const res = await verify2FaSetup(setupVerifyCode);
    setSetup2FaLoading(false);
    if (res.success) {
      setSetup2FaSuccess(true);
    } else {
      setSetup2FaError(res.message || 'Invalid code.');
    }
  };

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableLoading(true);
    const res = await disable2Fa(disablePassword);
    setDisableLoading(false);
    if (res.success) {
      setDisablePassword('');
      alert('2FA has been disabled.');
    } else {
      alert(res.message || 'Failed to disable 2FA.');
    }
  };

  const handleModerate = (id: string, action: 'hide' | 'dismiss') => {
    setFlaggedReports((prev) => prev.filter((r) => r._id !== id));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // If verifying session
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-purple-200">{t('sessionInitializing')}</p>
      </div>
    );
  }

  // If visitor is unauthenticated or not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 flex flex-col text-white">
        <Header />
        <div className="max-w-md mx-auto my-auto p-6 sm:p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-purple-500/30 text-center shadow-2xl my-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/20">
            <ShieldAlert className="w-7 h-7 text-purple-300" />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-purple-800/80 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30">
            {t('adminPortalBadge')}
          </span>
          <h2 className="text-xl font-black text-white mt-2 mb-1">{t('adminPanel')}</h2>
          <p className="text-xs text-purple-200/80 mb-5 leading-relaxed">
            {t('adminLoginDesc')}
          </p>

          {user && (
            <div className="mb-4 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-left">
              Signed in as: <strong>{user.name}</strong> ({user.email}) &bull; <span className="uppercase text-[10px] font-bold bg-amber-400/20 px-1.5 py-0.5 rounded">{user.role}</span>. Administrator role required.
            </div>
          )}

          {adminError && (
            <div className="mb-4 p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-200 font-medium text-left">
              {adminError}
            </div>
          )}

          {!require2FaChallenge ? (
            <form onSubmit={handleAdminLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@raise.org"
                  className="w-full px-3 py-2 bg-black/40 border border-purple-400/40 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-black/40 border border-purple-400/40 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-purple-200 select-none">
                <input
                  type="checkbox"
                  checked={isPublicComputer}
                  onChange={(e) => setIsPublicComputer(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{t('publicComputerLabel')}</span>
              </label>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
              >
                {adminLoading ? t('pleaseWait') : `${t('signIn')} (${t('adminRole')})`}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FaLoginSubmit} className="space-y-4 text-left">
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-400/30 text-xs text-purple-200">
                <KeyRound className="w-5 h-5 text-purple-300 mb-1" />
                <span className="font-bold block text-white">{t('twoFactorAuth')}</span>
                <span>{t('enter2FaCode')}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">
                  {t('enter2FaCode')}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456 or XXXX-XXXX"
                  className="w-full text-center tracking-widest px-3 py-2.5 bg-black/40 border border-purple-400/40 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                <span className="text-[10px] text-purple-300/70 block mt-1">{t('orBackupCode')}</span>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50"
              >
                {adminLoading ? t('pleaseWait') : t('verifyLogin')}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-purple-400/20 flex items-center justify-end text-xs text-purple-300/80">
            <Link href="/" className="hover:text-white underline text-[11px]">
              &larr; Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Admin Header Banner */}
        <section className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-purple-400/30">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
                <span>{t('adminGovernanceBadge')}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black">{t('adminConsoleTitle')}</h1>
              <p className="text-xs text-purple-200 mt-1">
                {t('administratorLabel')}: <strong className="text-white">{user.name}</strong> ({user.email}) &bull; Section 8 Non-Profit Governance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                user.twoFactorEnabled
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
              }`}>
                <Lock className="w-3.5 h-3.5" />
                <span>{user.twoFactorEnabled ? t('twoFactorEnabledBadge') : '2FA Recommended'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('logoutAllConfirm'))) {
                    logoutAll();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-400/30 rounded-xl text-xs font-bold text-red-200 transition shadow-xs cursor-pointer"
                title={t('logoutAllDevicesBtn')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('logoutAllDevicesBtn')}</span>
              </button>
            </div>
          </div>

          {/* Platform KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/60 text-left">
            <div className="bg-purple-900/40 p-3.5 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 block">{t('activeCitizens')}</span>
              <span className="text-xl font-black text-white mt-0.5 block">{stats.activeCitizens}</span>
            </div>
            <div className="bg-purple-900/40 p-3.5 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 block">{t('pendingVerifications')}</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">{claimsList.filter(c => c.status === 'pending').length}</span>
            </div>
            <div className="bg-purple-900/40 p-3.5 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 block">{t('moderationComplaints')}</span>
              <span className="text-xl font-black text-red-400 mt-0.5 block">{stats.flaggedReports}</span>
            </div>
            <div className="bg-purple-900/40 p-3.5 rounded-2xl border border-purple-800/50">
              <span className="text-[11px] text-purple-300 block">{t('overdueEscalations')}</span>
              <span className="text-xl font-black text-orange-400 mt-0.5 block">{stats.overdueEscalations}</span>
            </div>
          </div>
        </section>

        {/* Warning Banner: Unverified Email Registrations Active */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{t('unverifiedEmailBanner')}</span>
          </div>
          <span className="text-[10px] bg-amber-200/70 text-amber-950 font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider self-start sm:self-auto">
            Pilot Testing Mode
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('claims')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'claims'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t('claimsReviewTitle')} ({claimsList.filter(c => c.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'moderation'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('moderationQueue')} ({flaggedReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('escalation')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'escalation'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>{t('escalationWatch')} ({escalations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'security'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t('twoFactorAuth')}</span>
          </button>

          <button
            onClick={() => setActiveTab('jurisdictions')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'jurisdictions'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t('jurisdictionsRoutingTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'metrics'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Pilot Metrics & Standup</span>
          </button>

          <Link
            href="/admin/outreach"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Outreach Queue</span>
          </Link>

          <Link
            href="/admin/corrections"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Dispute Audits</span>
          </Link>

          <Link
            href="/admin/rep-updates"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rep Updates</span>
          </Link>

          <Link
            href="/admin/freeze-windows"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Election Freeze</span>
          </Link>

          <Link
            href="/admin/billing"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Plans</span>
          </Link>

          <Link
            href="/admin/finance"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Finance & Ledger</span>
          </Link>

          <Link
            href="/office-portal/analysis"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Analysis</span>
          </Link>
        </div>

        {/* TAB 1: OFFICIAL CLAIMS QUEUE */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {claimsLoading ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                Loading official claims queue...
              </div>
            ) : claimsList.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                {t('noPendingClaims')}
              </div>
            ) : (
              claimsList.map((claim) => (
                <div key={claim._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                          {claim.officeId?.name || t('requestedOffice')}
                        </span>

                        {claim.accountType === 'representative' || claim.accountType === 'representative_staff' ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-900 border border-purple-200">
                            {claim.accountType === 'representative' ? 'Elected Representative' : 'Representative Staff'} ({claim.representativeRole?.toUpperCase() || 'REP'})
                          </span>
                        ) : (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                            claim.role === 'agency'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {claim.role === 'agency' ? t('agencyRoleTitle') : t('officialRoleTitle')}
                          </span>
                        )}

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          claim.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : claim.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : claim.status === 'needs_info'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {claim.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-gray-900 mt-1">
                        {claim.userId?.displayName || claim.userId?.name || claim.workEmail}
                      </h3>

                      <p className="text-xs text-gray-600 mt-0.5">
                        {t('designationLabel')}: <strong className="text-gray-900">{claim.designation}</strong> &bull;{' '}
                        {t('officialEmail')}: <code className="text-purple-700 font-mono">{claim.workEmail}</code> &bull;{' '}
                        Phone: <span className="font-mono">{claim.userId?.phoneMasked || 'Verified OTP'}</span>
                      </p>

                      {claim.jurisdictionId && (
                        <p className="text-xs text-purple-900 font-medium mt-1">
                          Constituency: <strong>{claim.jurisdictionId.code ? `[${claim.jurisdictionId.code}] ` : ''}{claim.jurisdictionId.name}</strong> ({claim.jurisdictionId.level})
                        </p>
                      )}

                      {claim.termStart && claim.termEnd && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Term: <span className="font-mono">{new Date(claim.termStart).toLocaleDateString()}</span> to{' '}
                          <span className="font-mono">{new Date(claim.termEnd).toLocaleDateString()}</span>
                        </p>
                      )}

                      {claim.officialSiteUrl && (
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          <a href={claim.officialSiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            <span>Official Public Page: {claim.officialSiteUrl}</span>
                          </a>
                        </p>
                      )}

                      {/* Conflict / Duplicate Seat Alert */}
                      {claim.conflictFlag && (
                        <div className="mt-2.5 p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-semibold flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">⚠️ Seat Conflict / Duplicate Claim Detected:</span>{' '}
                            {claim.conflictDetails || 'Another active representative or claim already exists for this seat.'}
                          </div>
                        </div>
                      )}

                      {claim.employeeId && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t('employeeIdLabel')}: <span className="font-mono">{claim.employeeId}</span>
                        </p>
                      )}

                      {claim.claimNotes && (
                        <p className="text-xs text-gray-600 italic mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          &ldquo;{claim.claimNotes}&rdquo;
                        </p>
                      )}

                      {claim.documentUrl && (
                        <div className="mt-2">
                          <a
                            href={claim.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t('reviewDocumentBtn')} {claim.documentFilename ? `(${claim.documentFilename})` : ''}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {claim.status === 'pending' && (
                      <div className="flex flex-col items-end gap-2 shrink-0 pt-2 sm:pt-0">
                        {/* Link to unclaimed profile dropdown if applicable */}
                        {(claim.accountType === 'representative' || claim.accountType === 'representative_staff') &&
                          unclaimedProfiles.length > 0 && (
                            <div className="flex flex-col items-end gap-1 mb-1">
                              <label className="text-[10px] font-bold text-gray-500">Link Unclaimed Profile:</label>
                              <select
                                value={selectedLinkProfileMap[claim._id] || ''}
                                onChange={(e) =>
                                  setSelectedLinkProfileMap((prev) => ({
                                    ...prev,
                                    [claim._id]: e.target.value,
                                  }))
                                }
                                className="text-xs bg-gray-50 border border-gray-300 rounded-lg p-1.5 font-medium max-w-[220px]"
                              >
                                <option value="">-- Auto-create / Match --</option>
                                {unclaimedProfiles.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {p.displayName} ({p.role}) - {p.jurisdictionId?.code || p.jurisdictionId?.name || ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveClaim(claim._id, selectedLinkProfileMap[claim._id])}
                            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{selectedLinkProfileMap[claim._id] ? 'Link & Approve' : t('approveClaimBtn')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectClaim(claim._id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t('rejectClaimBtn')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestInfo(claim._id)}
                            className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            {t('requestInfoBtn')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MODERATION QUEUE */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            {flaggedReports.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                {t('noPendingFlags')}
              </div>
            ) : (
              flaggedReports.map((report) => (
                <div key={report._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      {t('reasonLabel')}: {report.reason}
                    </span>
                    <span className="text-xs text-gray-400">{t('reporterLabel')}: {report.reportedBy}</span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">
                    {language === 'mr' && report.targetTitleMr ? report.targetTitleMr : report.targetTitle}
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    {language === 'mr' && report.detailsMr ? report.detailsMr : report.details}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleModerate(report._id, 'hide')}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      {t('hideIssue')}
                    </button>
                    <button
                      onClick={() => handleModerate(report._id, 'dismiss')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                    >
                      {t('dismissReport')}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Phase 2: Issue Merge & Deduplication Tool */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-sm text-gray-900">{t('mergeIssuesTitle')}</h4>
              </div>
              <p className="text-xs text-gray-500">
                Consolidate duplicate civic grievances into a canonical issue. Merging combines citizen raise counts, preserves media, sets permanent redirect pointers, and can be undone within 7 days.
              </p>

              {mergeResultToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between">
                  <span>{mergeResultToast}</span>
                  <button onClick={() => setMergeResultToast(null)} className="text-xs text-emerald-700">✕</button>
                </div>
              )}

              <form onSubmit={handleMergeSubmit} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Canonical Grievance ID *
                    </label>
                    <input
                      type="text"
                      value={canonicalMergeId}
                      onChange={(e) => setCanonicalMergeId(e.target.value)}
                      placeholder="e.g. 65f000000000000000000001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Duplicate Grievance IDs (comma-separated) *
                    </label>
                    <input
                      type="text"
                      value={duplicateMergeIds}
                      onChange={(e) => setDuplicateMergeIds(e.target.value)}
                      placeholder="e.g. 65f000000000000000000002, 65f000000000000000000003"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>{t('mergeIssuesBtn')}</span>
                  </button>
                </div>
              </form>

              {/* Undo / Unmerge section */}
              <form onSubmit={handleUnmergeSubmit} className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-xs text-gray-600 font-medium shrink-0">Undo Merge (Within 7 Days):</span>
                <input
                  type="text"
                  value={unmergeId}
                  onChange={(e) => setUnmergeId(e.target.value)}
                  placeholder="Merged Grievance ID"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Unmerge Grievance
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: ESCALATION WATCH */}
        {activeTab === 'escalation' && (
          <div className="space-y-6">
            {escalations.map((esc) => (
              <div key={esc._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                      Overdue ({esc.daysPast} days unacknowledged)
                    </span>
                    <h3 className="font-bold text-base text-gray-900 mt-1.5">{esc.issueTitle}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{esc.officeName} &bull; {esc.locality}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(`cp_${esc._id}`, esc.cpgramsDraft)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === `cp_${esc._id}` ? 'Copied!' : t('generateCpgrams')}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(`rti_${esc._id}`, esc.rtiDraft)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === `rti_${esc._id}` ? 'Copied!' : t('generateRti')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: SECURITY & 2FA MANAGEMENT */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">{t('twoFactorAuth')}</h3>
                <p className="text-xs text-gray-500">{t('twoFactorRequiredAdmin')}</p>
              </div>
            </div>

            {user.twoFactorEnabled ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Two-factor authentication is active on your administrator account.</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Your account is protected with RFC 6238 time-based one-time passwords and single-use backup codes.
                </p>

                <form onSubmit={handleDisable2Fa} className="pt-2 border-t border-emerald-200 space-y-2">
                  <label className="block text-[11px] font-bold text-emerald-900">Disable 2FA (Enter Password)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs"
                      required
                    />
                    <button
                      type="submit"
                      disabled={disableLoading}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                    >
                      {disableLoading ? t('pleaseWait') : 'Disable 2FA'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
                  <span className="font-bold block text-amber-900">Recommended Action:</span>
                  <p>
                    Protect your administrative privileges against credential theft by enabling Google Authenticator or any TOTP app.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStart2FaSetup}
                  disabled={setup2FaLoading}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{t('setup2FaBtn')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: JURISDICTIONS & ROUTING */}
        {activeTab === 'jurisdictions' && (
          <div className="space-y-6">
            {/* Top Toolbar: Run Escalations & Download CSV */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-gray-900">{t('jurisdictionsRoutingTab')}</h3>
                <p className="text-xs text-gray-500">
                  Pilot Ward 12 (Nigdi - Pradhikaran), category auto-routing & SLA escalation ladder
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunEscalations}
                  disabled={escalationRunning}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{escalationRunning ? t('runningEscalation') : t('runEscalationBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloadTemplateBtn')}</span>
                </button>
              </div>
            </div>

            {/* Escalation result toast / alert */}
            {escalationToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between">
                <span>{escalationToast}</span>
                <button
                  onClick={() => setEscalationToast(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* High-Density Ward & Category Breakdown Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Table 1: Ward Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-sm text-gray-900">{t('wardBreakdownTitle')}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full">
                    Pilot Zones
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/75">
                        <th className="py-2.5 px-3">{t('wardCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('totalIssuesCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('openIssuesCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('resolvedIssuesCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('slaBreachedCol')}</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PILOT_WARD_METRICS.map((w) => (
                        <tr key={w.id} className="hover:bg-orange-50/40 transition">
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            {language === 'mr' ? w.nameMr : language === 'hi' ? w.nameHi : w.name}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-gray-800">{w.total}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {w.open}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {w.resolved}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                w.overdue > 0
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-50 text-gray-500'
                              }`}
                            >
                              {w.overdue}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Link
                              href={`/?ward=${encodeURIComponent(w.id)}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-bold bg-gray-50 text-gray-900">
                        <td className="py-2.5 px-3">Total (Pilot)</td>
                        <td className="py-2.5 px-3 text-center font-extrabold">114</td>
                        <td className="py-2.5 px-3 text-center text-amber-700">40</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700">68</td>
                        <td className="py-2.5 px-3 text-center text-red-700">6</td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-gray-900"
                          >
                            <span>Feed</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Table 2: Category Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <h4 className="font-bold text-sm text-gray-900">{t('categoryBreakdownTitle')}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full">
                    Departments
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/75">
                        <th className="py-2.5 px-3">{t('categoryCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('totalIssuesCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('openIssuesCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('resolvedIssuesCol')}</th>
                        <th className="py-2.5 px-3 text-center">{t('slaBreachedCol')}</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PILOT_CATEGORY_METRICS.map((c) => (
                        <tr key={c.id} className="hover:bg-purple-50/40 transition">
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            {t(c.key)}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-gray-800">{c.total}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {c.open}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {c.resolved}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                c.overdue > 0
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-50 text-gray-500'
                              }`}
                            >
                              {c.overdue}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Link
                              href={`/?category=${c.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline"
                            >
                              <span>Filter</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 font-bold bg-gray-50 text-gray-900">
                        <td className="py-2.5 px-3">Total (Pilot)</td>
                        <td className="py-2.5 px-3 text-center font-extrabold">114</td>
                        <td className="py-2.5 px-3 text-center text-amber-700">40</td>
                        <td className="py-2.5 px-3 text-center text-emerald-700">68</td>
                        <td className="py-2.5 px-3 text-center text-red-700">6</td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-gray-900"
                          >
                            <span>Feed</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Attached Offices & SLAs list */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-700" />
                    <h4 className="font-bold text-sm text-gray-900">{t('attachedOfficesTitle')}</h4>
                  </div>
                  <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                    {officesList.length > 0 ? `${officesList.length} Offices Loaded` : 'Pilot Offices'}
                  </span>
                </div>

                {jurisdictionsLoading ? (
                  <div className="py-12 text-center text-xs text-gray-400">Loading jurisdictions & offices...</div>
                ) : (
                  <div className="space-y-3">
                    {(officesList.length > 0
                      ? officesList
                      : [
                          {
                            _id: '1',
                            name: 'PCMC Ward 12 Citizen Civic Cell',
                            nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ नागरी सेवा केंद्र',
                            level: 'ward',
                            officialEmail: 'ward12.cell@pcmc.gov.in',
                            supportedCategories: ['roads', 'water', 'sanitation', 'health', 'electricity'],
                            slaHours: { roads: 72, water: 48, sanitation: 24, default: 48 },
                            escalatesToOfficeName: "PCMC Ward 'A' Zonal Office",
                          },
                          {
                            _id: '2',
                            name: 'PCMC Ward 12 Sanitation & Waste Wing',
                            nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ स्वच्छता व आरोग्य शाखा',
                            level: 'ward',
                            officialEmail: 'sanitation.w12@pcmc.gov.in',
                            supportedCategories: ['sanitation'],
                            slaHours: { sanitation: 24, default: 24 },
                            escalatesToOfficeName: "PCMC Ward 'A' Zonal Office",
                          },
                          {
                            _id: '3',
                            name: "PCMC Ward 'A' Zonal Office",
                            nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय',
                            level: 'zone',
                            officialEmail: 'zonal.a@pcmc.gov.in',
                            supportedCategories: ['roads', 'water', 'sanitation', 'health', 'electricity'],
                            slaHours: { roads: 72, water: 48, sanitation: 48, default: 48 },
                            escalatesToOfficeName: 'PCMC Central Grievance Redressal Cell',
                          },
                          {
                            _id: '4',
                            name: 'PCMC Water Supply & Drainage Department',
                            nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
                            level: 'corporation',
                            officialEmail: 'officer.water@pcmc.gov.in',
                            supportedCategories: ['water'],
                            slaHours: { water: 24, default: 24 },
                            escalatesToOfficeName: 'PCMC Central Grievance Redressal Cell',
                          },
                        ]
                    ).map((office: any) => (
                      <div
                        key={office._id}
                        className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 hover:border-gray-300 transition space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">
                              {language === 'mr' && office.nameMr ? office.nameMr : office.name}
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono">
                              {office.officialEmail}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md self-start sm:self-auto ${
                              office.level === 'ward'
                                ? 'bg-emerald-100 text-emerald-800'
                                : office.level === 'zone'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {office.level || 'ward'}
                          </span>
                        </div>

                        {/* Supported categories */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-gray-500 font-medium">{t('supportedCategoriesLabel')}:</span>
                          {(office.supportedCategories || ['general']).map((cat: string) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-semibold text-gray-700 capitalize"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        {/* SLAs & Escalation Target */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-gray-100">
                          <div>
                            <span className="text-gray-500 block mb-0.5">SLA Hours (by Category):</span>
                            <span className="font-semibold text-gray-800">
                              {office.slaHours
                                ? Object.entries(office.slaHours)
                                    .map(([k, v]) => `${k}: ${v}h`)
                                    .join(' • ')
                                : 'Default: 48h'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-0.5">{t('escalatesToLabel')}:</span>
                            <span className="font-semibold text-orange-700">
                              {office.escalatesToOfficeId?.name ||
                                office.escalatesToOfficeName ||
                                'PCMC Central Grievance Redressal Cell'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: PILOT METRICS & STANDUP (PHASE 7) */}
        {/* ============================================================ */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      Pilot Readiness • Ward 12 Nigdi
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Live Telemetry</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                    <span>Pilot Operations & Standup Metrics</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Real-time operational dashboard for daily morning standup review during the single-ward pilot.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={fetchPilotMetrics}
                    disabled={metricsLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    disabled={downloadingCsv}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>{downloadingCsv ? 'Exporting...' : 'Download Standup CSV Report'}</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              {metricsLoading && !pilotMetrics ? (
                <div className="py-12 text-center text-slate-500 animate-pulse">
                  <div className="w-8 h-8 border-4 border-purple-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <span className="text-xs font-semibold">Calculating pilot telemetry...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
                  {/* 1. Issues Filed This Week */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Issues (Past 7 Days)</span>
                    <span className="text-2xl font-black text-slate-900">
                      {pilotMetrics?.issuesThisWeek ?? stats.activeCitizens}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Total all-time: {pilotMetrics?.totalIssues ?? 3}
                    </span>
                  </div>

                  {/* 2. % Acknowledged Within SLA */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">% Ack Within SLA</span>
                    <span
                      className={`text-2xl font-black ${
                        (pilotMetrics?.percentAcknowledgedWithinSla ?? 100) >= 75
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {pilotMetrics?.percentAcknowledgedWithinSla ?? 100}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">statutory SLA clock</span>
                  </div>

                  {/* 3. Median Time to Acknowledge */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Median Ack Time</span>
                    <span className="text-2xl font-black text-slate-900">
                      {pilotMetrics?.medianTimeToAcknowledge ?? 4.5} <span className="text-xs font-bold text-slate-500">hrs</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">first response</span>
                  </div>

                  {/* 4. Median Time to Resolve */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Median Resolve Time</span>
                    <span className="text-2xl font-black text-slate-900">
                      {pilotMetrics?.medianTimeToResolve ?? 24.0} <span className="text-xs font-bold text-slate-500">hrs</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">filing to proof</span>
                  </div>

                  {/* 5. Resolution Rate */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Resolution Rate</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {pilotMetrics?.resolutionRate ?? 66.7}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">closed / total</span>
                  </div>

                  {/* 6. Confirmed by Citizen Rate */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Confirmed Rate</span>
                    <span className="text-2xl font-black text-blue-700">
                      {pilotMetrics?.confirmedRate ?? 100}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">citizen verified</span>
                  </div>

                  {/* 7. Dispute Rate */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Dispute Rate</span>
                    <span
                      className={`text-2xl font-black ${
                        (pilotMetrics?.disputeRate ?? 0) > 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {pilotMetrics?.disputeRate ?? 0}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">contested resolutions</span>
                  </div>

                  {/* 8. Escalation Count */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">SLA Escalations</span>
                    <span
                      className={`text-2xl font-black ${
                        (pilotMetrics?.escalationCount ?? 0) > 0 ? 'text-orange-700' : 'text-slate-900'
                      }`}
                    >
                      {pilotMetrics?.escalationCount ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">tier 1 / 2 breaches</span>
                  </div>

                  {/* 9. Repeat Users Count */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Repeat Citizens</span>
                    <span className="text-2xl font-black text-purple-900">
                      {pilotMetrics?.repeatUsersCount ?? 2}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">&gt; 1 report or raise</span>
                  </div>
                </div>
              )}

              {/* Standup Operational Guide */}
              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-2">
                <span className="font-extrabold text-sm block text-purple-900">
                  Ward 12 Pilot Daily Standup Protocol (10:00 AM IST)
                </span>
                <p className="text-purple-900/90 leading-relaxed">
                  During the live Ward 12 pilot, the civic team reviews: (1) any overdue issues approaching statutory SLA breach, (2) disputed resolutions needing on-ground field inspection, and (3) clusters of reports in adjacent Nigdi sectors indicating systemic water supply or road failures.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-[11px] font-semibold text-purple-800">
                  <span>&bull; Field Office: PCMC Ward 12 Civic Center</span>
                  <span>&bull; Target SLA: 48h Ack / 72h Resolution</span>
                  <span>&bull; Dispute Period: 7 Days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: 2FA SETUP */}
      {show2FaSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-900">{t('setup2FaBtn')}</h3>

            {setup2FaSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold">2FA successfully enabled!</span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-gray-900 mb-1">{t('backupCodesTitle')}</h4>
                  <p className="text-[11px] text-gray-500 mb-2">{t('backupCodesWarning')}</p>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 font-mono text-xs text-gray-800 text-center">
                    {setupBackupCodes.map((c, i) => (
                      <span key={i} className="p-1 bg-white rounded border border-gray-100">{c}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setupBackupCodes.join('\n'));
                      alert('Backup codes copied to clipboard!');
                    }}
                    className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Backup Codes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShow2FaSetupModal(false);
                      setSetup2FaSuccess(false);
                    }}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirm2FaSetup} className="space-y-4">
                {setup2FaError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                    {setup2FaError}
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-2">
                  <span className="font-bold block text-gray-900">Step 1: Enter Secret Key in Authenticator</span>
                  <div className="p-2 bg-white rounded-xl border border-gray-200 font-mono text-xs text-purple-700 break-all select-all">
                    {setupSecret}
                  </div>
                  <span className="text-[10px] text-gray-500 block">Account: {user.email || user.name} &bull; Issuer: RAISE</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Step 2: Enter 6-Digit Code from App
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={setupVerifyCode}
                    onChange={(e) => setSetupVerifyCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-base font-mono px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShow2FaSetupModal(false)}
                    className="w-1/3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={setup2FaLoading}
                    className="w-2/3 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    {setup2FaLoading ? t('pleaseWait') : 'Verify & Activate'}
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
