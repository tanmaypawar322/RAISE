'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { slugifyTitle } from '../lib/slug';
import {
  MapPin,
  Clock,
  ThumbsUp,
  Share2,
  Building,
  Mic,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Camera,
} from 'lucide-react';

export interface IssueItem {
  _id: string;
  title: string;
  titleMr?: string;
  description: string;
  descriptionMr?: string;
  category: string;
  labels?: string[];
  location: {
    address?: string;
    ward?: string;
    city?: string;
  };
  office?: {
    name: string;
    nameMr?: string;
    claimStatus: string;
  };
  media?: Array<{
    type: string;
    url: string;
  }>;
  status: string;
  raiseCount: number;
  createdAt: string;
  authorName?: string;
}

interface IssueCardProps {
  issue: IssueItem;
  dataSaver?: boolean;
}

export function IssueCard({ issue, dataSaver = false }: IssueCardProps) {
  const { t, language } = useLanguage();
  const { user, token, openAuthModalWithAction, pendingAction, clearPendingAction } = useAuth();

  const [hasRaised, setHasRaised] = useState(false);
  const [raiseCount, setRaiseCount] = useState(issue.raiseCount);
  const [loading, setLoading] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  // Resume support action if user just authenticated for this issue
  React.useEffect(() => {
    if (user && pendingAction?.type === 'support_issue' && pendingAction.issueId === issue._id && !hasRaised) {
      clearPendingAction();
      handleRaise();
    }
  }, [user, pendingAction]);

  const displayTitle = language === 'mr' && issue.titleMr ? issue.titleMr : issue.title;
  const displayDesc = language === 'mr' && issue.descriptionMr ? issue.descriptionMr : issue.description;

  const handleRaise = async () => {
    if (!user) {
      openAuthModalWithAction({ type: 'support_issue', issueId: issue._id });
      return;
    }
    if (hasRaised) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${issue._id}/raise`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (res.ok) {
        setHasRaised(true);
        setRaiseCount((prev) => prev + 1);
      } else {
        // Optimistic UI for mock
        setHasRaised(true);
        setRaiseCount((prev) => prev + 1);
      }
    } catch {
      // Optimistic dev fallback
      setHasRaised(true);
      setRaiseCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🚨 *${issue.title}*\n📍 ${issue.location.ward || 'पिंपरी-चिंचवड'}, ${issue.location.city || 'पुणे'}\n👥 ${raiseCount} नागरिकांनी पाठिंबा दिला आहे.\n\nलोकआवाज (RAISE) वर या समस्येला पाठिंबा द्या:`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Status mapping
  const statusColors: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    acknowledged: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-purple-50 text-purple-700 border-purple-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const getStatusText = (status: string) => {
    if (status === 'acknowledged') return t('statusAcknowledged');
    if (status === 'in_progress') return t('statusInProgress');
    if (status === 'resolved') return t('statusResolved');
    return t('statusSubmitted');
  };

  const officeName =
    language === 'mr' && issue.office?.nameMr ? issue.office.nameMr : issue.office?.name;

  return (
    <article className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition">
      {/* Top Meta: Category & Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {t(issue.category as any) || issue.category}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            statusColors[issue.status] || statusColors.submitted
          }`}
        >
          {issue.status === 'resolved' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          <span>{getStatusText(issue.status)}</span>
        </span>
      </div>

      {/* Dynamic Civic Verification Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {issue.labels.map((label: string) => (
            <span
              key={label}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                label === 'Verified by citizens'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : label === 'Disputed'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Title & Description */}
      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-1.5 group">
        <Link
          href={`/issues/${issue._id}/${slugifyTitle(issue.title)}`}
          className="hover:text-orange-600 transition inline-flex items-center gap-1.5"
        >
          <span>{displayTitle}</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 shrink-0 opacity-0 group-hover:opacity-100 transition" />
        </Link>
      </h3>
      <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">
        {displayDesc}
      </p>

      {/* Voice note indicator or Photo */}
      {issue.media && issue.media.length > 0 && (
        <div className="mb-3">
          {issue.media.some((m) => m.type === 'voice_note') && (
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-medium text-orange-900 mb-2">
              <Mic className="w-4 h-4 text-orange-600 animate-pulse" />
              <span>{language === 'mr' ? 'ऑडिओ व्हॉइस नोट जोडली आहे' : 'Audio voice note attached'}</span>
            </div>
          )}
          {issue.media.find((m) => m.type === 'photo') && (
            dataSaver && !showPhoto ? (
              <button
                type="button"
                onClick={() => setShowPhoto(true)}
                className="w-full py-3 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Camera className="w-4 h-4 text-gray-500" />
                <span>
                  {language === 'mr'
                    ? 'फोटो पहा (डेटा सेव्हर मोड - ~50KB)'
                    : language === 'hi'
                    ? 'फोटो देखें (डेटा सेवर मोड - ~50KB)'
                    : 'Load Photo (Data Saver Mode - ~50KB)'}
                </span>
              </button>
            ) : (
              <div className="rounded-xl overflow-hidden bg-gray-100 max-h-56">
                <img
                  src={issue.media.find((m) => m.type === 'photo')?.url}
                  alt={issue.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
            )
          )}
        </div>
      )}

      {/* Location and Designated Office */}
      <div className="space-y-1.5 text-xs text-gray-500 mb-4 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">
            {issue.location.ward ? `${issue.location.ward}, ` : ''}
            {issue.location.city || 'पिंपरी-चिंचवड'}
          </span>
        </div>
        {issue.office && (
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 truncate">
              <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-medium text-gray-700 truncate">{officeName}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                issue.office.claimStatus === 'claimed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {issue.office.claimStatus === 'claimed'
                ? t('officeClaimed')
                : t('officeUnclaimed')}
            </span>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRaise}
            disabled={loading || hasRaised}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              hasRaised
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasRaised ? 'fill-white' : ''}`} />
            <span>{hasRaised ? t('raisedButton') : t('raiseButton')}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/25 rounded-md text-[11px]">
              {raiseCount}
            </span>
          </button>
        </div>

        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition"
          title={t('shareWhatsApp')}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
      </div>
    </article>
  );
}
