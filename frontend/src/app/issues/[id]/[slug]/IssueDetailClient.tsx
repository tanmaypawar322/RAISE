'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import { ShareModal } from '../../../../components/ShareModal';
import { AppShell } from '../../../../components/AppShell';
import { CivicSealBadge } from '../../../../components/CivicSealBadge';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Share2,
  Copy,
  Check,
  Volume2,
  MessageCircle,
  GitMerge,
  Eye,
  UserCheck,
  Heart,
  Send,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

interface IssueDetailClientProps {
  initialIssue: any;
  isMerged?: boolean;
  mergedIntoId?: string;
}

export default function IssueDetailClient({
  initialIssue,
  isMerged = false,
  mergedIntoId,
}: IssueDetailClientProps) {
  const { t, language } = useLanguage();
  const { user, token, openAuthModalWithAction } = useAuth();

  const [issue, setIssue] = useState<any>(initialIssue);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Representative layer states
  const [repData, setRepData] = useState<any>(null);
  const [isAskingRep, setIsAskingRep] = useState(false);
  const [isTakingUp, setIsTakingUp] = useState(false);
  const [takeUpNote, setTakeUpNote] = useState('');
  const [showTakeUpModal, setShowTakeUpModal] = useState(false);
  const [showDeptNoteModal, setShowDeptNoteModal] = useState(false);
  const [deptNote, setDeptNote] = useState('');
  const [isSendingDeptNote, setIsSendingDeptNote] = useState(false);
  const [isThanking, setIsThanking] = useState(false);

  useEffect(() => {
    if (!issue?._id) return;
    const fetchReps = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/for-issue/${issue._id}`,
          { headers }
        );
        const data = await res.json();
        if (data.success) {
          setRepData(data);
        }
      } catch (err) {
        console.warn('Could not load representatives:', err);
      }
    };
    fetchReps();
  }, [issue?._id, token]);

  if (!issue) {
    return (
      <AppShell>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <AlertTriangle className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t('neutralNotFoundTitle')}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {t('neutralNotFoundDesc')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('backToFeed')}</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Generate localized WhatsApp share text
  const getWhatsAppShareUrl = () => {
    const wardText = issue.location?.ward || 'Pimpri-Chinchwad';
    const cityText = issue.location?.city || 'Pune';
    let text = '';

    if (language === 'mr') {
      text = `नागरिक समस्या (RAISE): ${issue.title}\n📍 ${wardText}, ${cityText}\nनागरिकांचा पाठिंबा: ${issue.raiseCount} नागरिक\nप्रशासनाकडून निवारणासाठी कृपया पाठिंबा द्या:\n${currentUrl}`;
    } else if (language === 'hi') {
      text = `नागरिक समस्या (RAISE): ${issue.title}\n📍 ${wardText}, ${cityText}\nनागरिक समर्थन: ${issue.raiseCount} नागरिक\nप्रशासन से समाधान के लिए कृपया समर्थन दें:\n${currentUrl}`;
    } else {
      text = `Civic Grievance on RAISE: ${issue.title}\n📍 ${wardText}, ${cityText}\nCitizen Support: ${issue.raiseCount} raises\nPlease support to demand statutory resolution:\n${currentUrl}`;
    }

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Support / Raise button
  const handleRaiseSupport = async () => {
    if (!user) {
      openAuthModalWithAction({ type: 'raise_issue' });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${issue._id}/raise`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setIssue((prev: any) => ({ ...prev, raiseCount: (prev.raiseCount || 0) + 1 }));
        setActionNotice(t('raisedButton'));
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Error registering support.');
    }
  };

  // Citizen confirmation vote
  const handleConfirmResolution = async () => {
    if (!user) {
      openAuthModalWithAction({ type: 'view_dashboard' });
      return;
    }

    setIsConfirming(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${issue._id}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setIssue((prev: any) => ({
          ...prev,
          confirmedByCount: (prev.confirmedByCount || 0) + 1,
          status: 'resolved',
        }));
        setActionNotice('Thank you! Resolution confirmed.');
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Network error confirming resolution.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Citizen dispute submit
  const handleDisputeResolution = async () => {
    if (!user) {
      openAuthModalWithAction({ type: 'view_dashboard' });
      return;
    }
    if (disputeReason.trim().length < 5) return;

    setIsDisputing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${issue._id}/dispute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: disputeReason }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setIssue((prev: any) => ({
          ...prev,
          disputedByCount: (prev.disputedByCount || 0) + 1,
          status: 'disputed',
          reopenCount: (prev.reopenCount || 0) + 1,
        }));
        setShowDisputeModal(false);
        setActionNotice('Grievance reopened. Statutory SLA restarted.');
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Error submitting dispute.');
    } finally {
      setIsDisputing(false);
    }
  };

  // Citizen asks representative to look into issue
  const handleAskRep = async (repId: string, role: string) => {
    if (!user) {
      openAuthModalWithAction({ type: 'raise_issue' });
      return;
    }
    setIsAskingRep(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/ask/${issue._id}/${repId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setActionNotice(t('repAskSent'));
        setRepData((prev: any) => ({
          ...prev,
          citizenAsks: [...(prev?.citizenAsks || []), data.ask],
          askCounts: {
            ...(prev?.askCounts || {}),
            [role]: ((prev?.askCounts || {})[role] || 0) + 1,
          },
        }));
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Error submitting ask.');
    } finally {
      setIsAskingRep(false);
    }
  };

  // Representative takes up issue
  const handleTakeUpIssue = async () => {
    if (!token) return;
    setIsTakingUp(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/take-up/${issue._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: takeUpNote }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowTakeUpModal(false);
        setActionNotice('Issue successfully taken up by your representative office.');
        setIssue(data.issue);
        setRepData((prev: any) => ({
          ...prev,
          alreadyTakenUpByUserRep: true,
          takenUpByRepIds: [...(prev?.takenUpByRepIds || []), prev?.userRepProfileId],
        }));
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Error taking up issue.');
    } finally {
      setIsTakingUp(false);
    }
  };

  // Representative sends inquiry note to department
  const handleSendDeptNote = async () => {
    if (!token || !deptNote.trim()) return;
    setIsSendingDeptNote(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/note/${issue._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: deptNote }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowDeptNoteModal(false);
        setDeptNote('');
        setActionNotice('Inquiry note transmitted to responsible department.');
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Error sending departmental note.');
    } finally {
      setIsSendingDeptNote(false);
    }
  };

  // Citizen says thank you to representative on confirmed resolution
  const handleThankRep = async () => {
    if (!user) {
      openAuthModalWithAction({ type: 'raise_issue' });
      return;
    }
    setIsThanking(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/thank/${issue._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setActionNotice(t('thankYouSent'));
        setRepData((prev: any) => ({
          ...prev,
          hasThanked: true,
          thanksCount: data.thanksCount,
        }));
      } else {
        setActionNotice(data.message);
      }
    } catch {
      setActionNotice('Error recording thanks.');
    } finally {
      setIsThanking(false);
    }
  };

  const photos = issue.media?.filter((m: any) => m.type === 'photo') || [];
  const videos = issue.media?.filter((m: any) => m.type === 'video') || [];
  const voiceNotes = issue.media?.filter((m: any) => m.type === 'voice_note') || [];
  const afterPhotos = issue.afterPhotos || [];

  // SLA Calculation
  const slaRemainingHours = issue.slaDeadline
    ? Math.max(0, Math.round((new Date(issue.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;
  const isSlaBreached = issue.slaDeadline && new Date(issue.slaDeadline).getTime() < Date.now();

  return (
    <AppShell
      title={issue?.title ? (issue.title.length > 45 ? `${issue.title.slice(0, 42)}...` : issue.title) : undefined}
      subtitle="Grievance Dossier"
    >
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToFeed')}</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
              title={t('shareModalTitle')}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('share')}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? t('linkCopiedToast') : t('copyDirectLinkBtn')}</span>
            </button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('shareWhatsAppBtn')}</span>
            </a>
          </div>
        </div>

        {/* Action Notice Banner */}
        {actionNotice && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-medium flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-blue-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Merged Grievance Banner */}
        {(isMerged || issue.status === 'merged') && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <GitMerge className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {t('mergedNoticeBanner')}
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Citizen support from this entry has been added to the primary issue record.
                </p>
              </div>
            </div>
            {issue.mergedIntoId && (
              <Link
                href={`/issues/${issue.mergedIntoId}/canonical`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shrink-0"
              >
                <span>{t('viewCanonicalIssueBtn')}</span>
              </Link>
            )}
          </div>
        )}

        {/* Main Dossier Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Bar */}
          <div className="p-6 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                {t(issue.category as any) || issue.category}
              </span>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  issue.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : issue.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : issue.status === 'disputed'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {t(
                  ('status' +
                    issue.status.charAt(0).toUpperCase() +
                    issue.status.slice(1)) as any
                ) || issue.status}
              </span>

              {issue.status !== 'resolved' && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    isSlaBreached
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {isSlaBreached
                    ? t('slaBreachedEscalated')
                    : `${slaRemainingHours}h ${t('slaTimeRemaining')}`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {issue.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  {issue.location?.landmark
                    ? `${issue.location.landmark}, ${issue.location.ward || 'Pimpri-Chinchwad'}`
                    : issue.location?.address || issue.location?.ward || 'Pimpri-Chinchwad'}
                </span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                <span>Reported by</span>
                <span className="font-semibold text-slate-800">
                  {issue.author?.displayName || 'Anonymous citizen'}
                </span>
                <CivicSealBadge
                  tier="resident"
                  jurisdiction={issue.location?.ward || 'Ward Resident'}
                  size="xs"
                />
              </span>
              <span>•</span>
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description & Audio */}
          <div className="p-6 space-y-6">
            <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed">
              <p>{issue.description}</p>
            </div>

            {/* Voice Notes Audio Player */}
            {voiceNotes.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>Citizen Voice Recording</span>
                </div>
                {voiceNotes.map((vn: any, idx: number) => (
                  <audio key={idx} controls className="w-full h-10 mt-1">
                    <source src={vn.url} type={vn.mimeType || 'audio/webm'} />
                    Your browser does not support audio playback.
                  </audio>
                ))}
              </div>
            )}

            {/* Video Proof Gallery */}
            {videos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Grievance Video Proof ({videos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((v: any, idx: number) => (
                    <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-black shadow-xs">
                      <video
                        src={v.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-56 object-contain bg-black"
                      >
                        Your browser does not support HTML5 video.
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before Media Gallery */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Grievance Media (Before)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {photos.map((p: any, idx: number) => (
                    <img
                      key={idx}
                      src={p.url}
                      alt={`Grievance photo ${idx + 1}`}
                      className="w-full h-56 object-cover rounded-xl border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Proof Section */}
            {(issue.resolutionNotes || afterPhotos.length > 0) && (
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{t('resolutionProofTitle')}</span>
                  </h3>
                  {issue.afterPhotoGpsFlag !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        issue.afterPhotoGpsFlag
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {issue.afterPhotoGpsFlag
                        ? t('gpsProximityAlert')
                        : t('gpsProximityVerified')}
                    </span>
                  )}
                </div>

                {issue.resolutionNotes && (
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
                        Official Departmental Resolution:
                      </p>
                      <CivicSealBadge
                        tier="executive"
                        officeName={issue.officeId?.name || issue.office?.name || 'Municipal Department'}
                        designation="Attending Officer"
                        size="xs"
                      />
                    </div>
                    <p>{issue.resolutionNotes}</p>
                  </div>
                )}

                {/* After Photos Side-by-Side */}
                {afterPhotos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-900">
                      {t('beforeAfterComparison')}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {afterPhotos.map((p: any, idx: number) => (
                        <div key={idx} className="relative">
                          <img
                            src={p.url}
                            alt="Resolution Proof"
                            className="w-full h-56 object-cover rounded-xl border border-emerald-200"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                            Work Completed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Citizen Confirmation & Dispute Action Block */}
            {(issue.status === 'resolved_pending_confirmation' || issue.status === 'resolved') && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Ward Citizen Verification
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {issue.confirmedByCount || 0} {t('confirmedCitizenCount')} •{' '}
                      {issue.disputedByCount || 0} {t('disputedCitizenCount')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConfirmResolution}
                      disabled={isConfirming}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                    >
                      {t('confirmWorkDoneBtn')}
                    </button>

                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition"
                    >
                      {t('disputeWorkBtn')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Responsible Office Dossier Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-700 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Responsible Authority
                    </h4>
                    <CivicSealBadge
                      tier="executive"
                      officeName={issue.officeId?.name || issue.office?.name || 'Local Authority'}
                      designation={issue.officeId?.department || 'Civil Administration'}
                      size="xs"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Statutory Mandate: {issue.slaHours || 48}h SLA Resolution Window
                  </p>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={handleRaiseSupport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow-sm cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>
                    {t('raiseButton')} ({issue.raiseCount})
                  </span>
                </button>
              </div>
            </div>

            {/* Who Represents This Place Panel */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <span>{t('whoRepresentsTitle')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('whoRepresentsDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('repSlaNotice')}</span>
                </div>
              </div>

              {/* Representative Actions Banner (if authenticated official covers this constituency) */}
              {repData?.alreadyTakenUpByUserRep && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="text-xs font-bold text-blue-900">{t('repTakenUpBadge')}</span>
                  </div>
                  <button
                    onClick={() => setShowDeptNoteModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shrink-0"
                  >
                    {t('requestDeptUpdateBtn')}
                  </button>
                </div>
              )}

              {repData?.canTakeUp && !repData?.alreadyTakenUpByUserRep && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-medium text-amber-900">
                    This grievance falls within your electoral jurisdiction.
                  </span>
                  <button
                    onClick={() => setShowTakeUpModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition shrink-0"
                  >
                    {t('takeUpIssueBtn')}
                  </button>
                </div>
              )}

              {/* Representatives Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(() => {
                  const tiers = [
                    {
                      roleKey: 'ward_councillor',
                      title: t('wardCouncillor'),
                      filter: (r: any) => ['ward_councillor', 'sarpanch'].includes(r.role),
                    },
                    {
                      roleKey: 'mla',
                      title: t('mlaRole'),
                      filter: (r: any) => ['mla', 'mlc'].includes(r.role),
                    },
                    {
                      roleKey: 'mp_lok_sabha',
                      title: t('mpRole'),
                      filter: (r: any) => ['mp_lok_sabha', 'mp_rajya_sabha'].includes(r.role),
                    },
                  ];

                  return tiers.map((tier, idx) => {
                    const matchedRep = repData?.representatives?.find(tier.filter);
                    const repRole = matchedRep?.role || tier.roleKey;
                    const alreadyAsked = repData?.citizenAsks?.some(
                      (a: any) => a.role === repRole || (matchedRep && a.representativeProfileId === matchedRep._id)
                    );
                    const askCount = repData?.askCounts?.[repRole] || 0;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              {tier.title}
                            </span>
                            {matchedRep?.status === 'verified' ? (
                              <CivicSealBadge
                                tier="constitutional"
                                role={matchedRep.role || tier.roleKey}
                                officeName={matchedRep.jurisdictionId?.name || issue.location?.ward}
                                designation={tier.title}
                                size="xs"
                              />
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                {t('notYetOnRaise')}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {matchedRep ? matchedRep.displayName : `Elected ${tier.title.split(' ')[0]}`}
                          </h4>

                          <p className="text-xs text-slate-500 mt-0.5">
                            {matchedRep?.jurisdictionId?.name
                              ? matchedRep.jurisdictionId.name
                              : issue.location?.ward || 'Local Constituency'}
                          </p>

                          {matchedRep?.status === 'verified' && (
                            <Link
                              href={`/representatives/${matchedRep._id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 mt-1 transition"
                            >
                              <span>View public record</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 space-y-2">
                          <div className="text-[11px] text-slate-600 font-medium">
                            {askCount > 0 ? (
                              <span>
                                <strong className="text-slate-900 font-bold">{askCount}</strong>{' '}
                                {t('repAskCount')}
                              </span>
                            ) : (
                              <span className="text-slate-400">No requests yet</span>
                            )}
                          </div>

                          {matchedRep ? (
                            matchedRep.isElectionFrozen ? (
                              <button
                                disabled
                                className="w-full px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Paused during election code of conduct</span>
                              </button>
                            ) : alreadyAsked ? (
                              <button
                                disabled
                                className="w-full px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-default"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Requested ✓ (72h SLA)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAskRep(matchedRep._id, matchedRep.role)}
                                disabled={isAskingRep}
                                className="w-full px-3 py-1.5 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{t('askRepBtn')}</span>
                              </button>
                            )
                          ) : (
                            <span className="block text-center text-[11px] text-slate-400 py-1 font-medium italic">
                              Representative not registered
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Citizen Gratitude Card (Citizen-confirmed resolutions) */}
              {(issue.status === 'resolved' || issue.status === 'resolved_pending_confirmation') && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>Elected Representative Credit & Gratitude</span>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Public credit is awarded strictly upon citizen-confirmed outcomes.
                    </p>
                    {repData?.thanksCount > 0 && (
                      <span className="inline-block mt-1 text-xs font-bold text-emerald-900">
                        ❤️ {repData.thanksCount} {t('thanksCount')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleThankRep}
                    disabled={isThanking || repData?.hasThanked}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-xs disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{repData?.hasThanked ? t('thankYouSent') : t('sayThankYouBtn')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Status Timeline & Escalation Ladder */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Statutory Status Timeline
              </h3>
              <div className="border-l-2 border-slate-200 pl-4 space-y-4 ml-2">
                {issue.statusTimeline?.map((item: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div className="text-xs font-bold text-slate-800 capitalize">
                      {item.status.replace(/_/g, ' ')}
                    </div>
                    {item.note && <div className="text-xs text-slate-600 mt-0.5">{item.note}</div>}
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Take Up Issue Modal */}
      {showTakeUpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t('takeUpIssueBtn')}
            </h3>
            <p className="text-xs text-slate-600">
              Taking up this grievance records your official oversight on the public timeline. The responsible department remains statutory owner and SLA clocks continue running.
            </p>
            <textarea
              value={takeUpNote}
              onChange={(e) => setTakeUpNote(e.target.value)}
              placeholder="Optional oversight note (e.g. Discussed with executive engineer for priority repair...)"
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTakeUpModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleTakeUpIssue}
                disabled={isTakingUp}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isTakingUp ? 'Confirming...' : 'Confirm Take Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Inquiry Note Modal */}
      {showDeptNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t('requestDeptUpdateBtn')}
            </h3>
            <p className="text-xs text-slate-600">
              Transmits an official inquiry note to the responsible department and appends it to the grievance audit timeline.
            </p>
            <textarea
              value={deptNote}
              onChange={(e) => setDeptNote(e.target.value)}
              placeholder={t('repNotePlaceholder')}
              rows={4}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeptNoteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSendDeptNote}
                disabled={isSendingDeptNote || deptNote.trim().length < 5}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSendingDeptNote ? 'Sending...' : 'Send Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {t('disputeResolutionBtn')}
            </h3>
            <p className="text-xs text-slate-600">
              {t('disputeReasonPrompt')}
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g. Pothole was only filled with mud, rainwater washed it out again..."
              rows={4}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDisputeResolution}
                disabled={isDisputing || disputeReason.trim().length < 5}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isDisputing ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Platform Share Sheet / Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        issue={issue}
      />
    </div>
    </AppShell>
  );
}
