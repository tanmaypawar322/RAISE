'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { slugifyTitle } from '../lib/slug';
import { ShareModal } from './ShareModal';
import {
  MapPin,
  Navigation,
  Clock,
  ThumbsUp,
  Share2,
  Building,
  Mic,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Camera,
  Video,
  X,
  Volume2,
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
    landmark?: string;
    ward?: string;
    city?: string;
    coordinates?: [number, number]; // [lng, lat]
  };
  office?: {
    name: string;
    nameMr?: string;
    claimStatus: string;
  };
  media?: Array<{
    type: string;
    url: string;
    mimeType?: string;
  }>;
  status: string;
  raiseCount: number;
  createdAt: string;
  authorName?: string;
  settlementType?: 'rural_panchayat' | 'urban_municipal';
  escalationTier?: number;
  isCommunityVerified?: boolean;
}

interface IssueCardProps {
  issue: IssueItem;
  dataSaver?: boolean;
  distanceMeters?: number;
}

export function IssueCard({ issue, dataSaver = false, distanceMeters }: IssueCardProps) {
  const { t, language } = useLanguage();
  const { user, token, openAuthModalWithAction, pendingAction, clearPendingAction } = useAuth();

  const [hasRaised, setHasRaised] = useState(false);
  const [raiseCount, setRaiseCount] = useState(issue.raiseCount);
  const [loading, setLoading] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

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

  const currentTier = issue.escalationTier || 1;
  const isRural = issue.settlementType === 'rural_panchayat';

  let nextTierTarget = 15;
  let nextAuthority = isRural ? (language === 'mr' ? 'तालुका गटविकास अधिकारी (BDO)' : language === 'hi' ? 'प्रखंड विकास पदाधिकारी (BDO)' : 'Taluka BDO') : (language === 'mr' ? 'महानगर आयुक्त / आमदार' : language === 'hi' ? 'नगर आयुक्त / विधायक' : 'Municipal Commissioner / MLA');
  if (currentTier === 2) {
    nextTierTarget = isRural ? 50 : 500;
    nextAuthority = isRural ? (language === 'mr' ? 'जिल्हाधिकारी / जि.प. मुख्य कार्यकारी' : language === 'hi' ? 'जिलाधिकारी / जि.प. सीईओ' : 'District Collector / ZP CEO') : (language === 'mr' ? 'जिल्हाधिकारी / खासदार' : language === 'hi' ? 'जिलाधिकारी / सांसद' : 'District Collector / MP');
  } else if (currentTier === 3) {
    nextTierTarget = isRural ? 250 : 2500;
    nextAuthority = isRural ? (language === 'mr' ? 'ग्रामविकास मंत्रालय' : language === 'hi' ? 'ग्रामीण विकास मंत्रालय' : 'Rural Dev Ministry') : (language === 'mr' ? 'नगरविकास मंत्रालय / मुख्यमंत्री' : language === 'hi' ? 'नगर विकास मंत्रालय / मुख्यमंत्री' : 'Urban Dev Ministry / CM');
  }
  const raisesNeeded = Math.max(0, nextTierTarget - raiseCount);
  const progressPercent = Math.min(100, Math.round((raiseCount / nextTierTarget) * 100));

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

      {/* Social Media Post Media (Photos, Video, Voice Note) */}
      {issue.media && issue.media.length > 0 && (() => {
        const photos = issue.media.filter((m) => m.type === 'photo');
        const videos = issue.media.filter((m) => m.type === 'video');
        const voiceNotes = issue.media.filter((m) => m.type === 'voice_note');

        if (photos.length === 0 && videos.length === 0 && voiceNotes.length === 0) return null;

        const isMediaHiddenByDataSaver = dataSaver && !showPhoto && (photos.length > 0 || videos.length > 0);

        return (
          <div className="mb-3 space-y-2">
            {/* Playable Citizen Voice Notes */}
            {voiceNotes.map((vn, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-orange-50/90 border border-orange-200 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
                  <Mic className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-orange-950 truncate">
                    {language === 'mr' ? 'नागरिक ऑडिओ रेकॉर्डिंग' : language === 'hi' ? 'नागरिक वॉयस रिकॉर्डिंग' : 'Citizen Voice Note'}
                  </div>
                  {vn.url && vn.url !== '#' && vn.url !== 'mock' ? (
                    <audio controls src={vn.url} className="w-full h-7 mt-0.5" />
                  ) : (
                    <p className="text-[10px] text-orange-700 italic">3s audio grievance recording</p>
                  )}
                </div>
              </div>
            ))}

            {/* Data Saver Mode Banner */}
            {isMediaHiddenByDataSaver ? (
              <button
                type="button"
                onClick={() => setShowPhoto(true)}
                className="w-full py-3 px-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Camera className="w-4 h-4 text-gray-500" />
                <span>
                  {t('loadMedia')} ({photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''}` : ''}
                  {photos.length > 0 && videos.length > 0 ? ', ' : ''}
                  {videos.length > 0 ? `${videos.length} video${videos.length > 1 ? 's' : ''}` : ''})
                </span>
              </button>
            ) : (
              <>
                {/* Playable Videos */}
                {videos.map((vid, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden bg-black border border-gray-200 shadow-2xs">
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full max-h-72 object-contain bg-black"
                      src={vid.url}
                    >
                      Your browser does not support HTML5 video.
                    </video>
                  </div>
                ))}

                {/* Social Media Photos Grid */}
                {photos.length > 0 && (
                  <div>
                    {photos.length === 1 && (
                      <div className="rounded-xl overflow-hidden bg-gray-100 max-h-72 border border-gray-100 shadow-2xs">
                        <img
                          src={photos[0].url}
                          alt={issue.title}
                          onClick={() => setSelectedLightboxImage(photos[0].url)}
                          className="w-full h-56 sm:h-64 object-cover cursor-pointer hover:opacity-95 transition"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {photos.length === 2 && (
                      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-gray-100 shadow-2xs">
                        {photos.map((p, idx) => (
                          <div key={idx} className="h-44 sm:h-48 bg-gray-100 overflow-hidden">
                            <img
                              src={p.url}
                              alt={`${issue.title} photo ${idx + 1}`}
                              onClick={() => setSelectedLightboxImage(p.url)}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {photos.length === 3 && (
                      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden h-52 sm:h-60 border border-gray-100 shadow-2xs">
                        <div className="h-full bg-gray-100 overflow-hidden">
                          <img
                            src={photos[0].url}
                            alt={`${issue.title} photo 1`}
                            onClick={() => setSelectedLightboxImage(photos[0].url)}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                            loading="lazy"
                          />
                        </div>
                        <div className="grid grid-rows-2 gap-1.5 h-full">
                          <div className="bg-gray-100 overflow-hidden">
                            <img
                              src={photos[1].url}
                              alt={`${issue.title} photo 2`}
                              onClick={() => setSelectedLightboxImage(photos[1].url)}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                              loading="lazy"
                            />
                          </div>
                          <div className="bg-gray-100 overflow-hidden">
                            <img
                              src={photos[2].url}
                              alt={`${issue.title} photo 3`}
                              onClick={() => setSelectedLightboxImage(photos[2].url)}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {photos.length >= 4 && (
                      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden h-56 sm:h-64 border border-gray-100 shadow-2xs">
                        {photos.slice(0, 3).map((p, idx) => (
                          <div key={idx} className="bg-gray-100 overflow-hidden">
                            <img
                              src={p.url}
                              alt={`${issue.title} photo ${idx + 1}`}
                              onClick={() => setSelectedLightboxImage(p.url)}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        <div
                          className="relative bg-gray-100 overflow-hidden cursor-pointer group"
                          onClick={() => setSelectedLightboxImage(photos[3].url)}
                        >
                          <img
                            src={photos[3].url}
                            alt={`${issue.title} photo 4`}
                            className="w-full h-full object-cover group-hover:opacity-90 transition"
                            loading="lazy"
                          />
                          {photos.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-base sm:text-lg">
                              +{photos.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Location and Designated Office */}
      <div className="space-y-1.5 text-xs text-gray-500 mb-4 pt-1 border-t border-gray-100">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate font-medium text-gray-700">
              {issue.location.landmark
                ? `${issue.location.landmark}, ${issue.location.ward || 'पिंपरी-चिंचवड'}`
                : `${issue.location.ward ? `${issue.location.ward}, ` : ''}${issue.location.city || 'पिंपरी-चिंचवड'}`}
            </span>
          </div>
        </div>

        {/* Distance badge when Nearest sort is active */}
        {distanceMeters !== undefined && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
            <Navigation className="w-3 h-3 text-blue-500" />
            <span>
              {distanceMeters < 1000
                ? t('distanceMeters').replace('{dist}', Math.round(distanceMeters).toString())
                : t('distanceKm').replace('{dist}', (distanceMeters / 1000).toFixed(1))}
            </span>
          </div>
        )}
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

      {/* Adaptive Escalation Progress Bar */}
      <div className="mb-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-gray-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>
              Tier {currentTier}/5: {isRural ? (language === 'mr' ? 'ग्रामपंचायत' : language === 'hi' ? 'ग्राम पंचायत' : 'Gram Panchayat') : (language === 'mr' ? 'प्रभाग कार्यालय' : language === 'hi' ? 'वार्ड कार्यालय' : 'Ward Office')}
            </span>
          </span>
          <span className="text-gray-500 font-normal truncate ml-2">
            {raisesNeeded > 0
              ? `${raisesNeeded} ${language === 'mr' ? 'नागरिक पाठिंबा हवा' : language === 'hi' ? 'और समर्थन चाहिए' : 'more raises'} ➔ ${nextAuthority}`
              : `${language === 'mr' ? 'पुढील स्तरावर पाठवले' : 'Escalated to'} ${nextAuthority}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
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
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition border border-slate-200 active:scale-95 shadow-2xs cursor-pointer"
          title={t('shareModalTitle')}
        >
          <Share2 className="w-3.5 h-3.5 text-slate-600" />
          <span>{t('share')}</span>
        </button>
      </div>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={selectedLightboxImage}
              alt="High resolution proof"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full cursor-pointer transition shadow-md"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-Platform Share Sheet / Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        issue={{
          _id: issue._id,
          title: issue.title,
          titleMr: issue.titleMr,
          category: issue.category,
          location: issue.location,
          settlementType: issue.settlementType,
          escalationTier: issue.escalationTier,
          raiseCount: raiseCount,
        }}
      />
    </article>
  );
}
