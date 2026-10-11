'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { slugifyTitle } from '../lib/slug';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  MapPin,
  ThumbsUp,
  AlertTriangle,
  Mail,
  ExternalLink,
} from 'lucide-react';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: {
    _id: string;
    title: string;
    titleMr?: string;
    category?: string;
    location?: {
      address?: string;
      landmark?: string;
      ward?: string;
      city?: string;
    };
    settlementType?: 'rural_panchayat' | 'urban_municipal';
    escalationTier?: number;
    raiseCount?: number;
  };
}

// Brand SVG Icons for pixel-perfect social representations
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.19 8.19 0 0 1-5.82 2.41h-.01c-1.48 0-2.93-.39-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.32-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
    </svg>
  );
}

function TwitterXIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

export function ShareModal({ isOpen, onClose, issue }: ShareModalProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayTitle = language === 'mr' && issue.titleMr ? issue.titleMr : issue.title;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raise.org';
  const slug = slugifyTitle(issue.title);
  const shareUrl = `${origin}/issues/${issue._id}/${slug}`;
  const raiseCount = issue.raiseCount || 1;
  const currentTier = issue.escalationTier || 1;
  const locationLabel = issue.location?.ward || issue.location?.address || 'स्थानिक विभाग';
  const cityLabel = issue.location?.city || '';
  const fullLocation = [locationLabel, cityLabel].filter(Boolean).join(', ');

  // Localized share messages
  let shareText = '';
  let xText = '';
  let emailSubject = '';
  let emailBody = '';

  if (language === 'mr') {
    shareText = `🚨 *${displayTitle}*\n📍 ${fullLocation}\n👥 ${raiseCount} नागरिकांनी पाठिंबा दिला आहे (Tier ${currentTier}/5).\n\nRAISE वर या समस्येला पाठिंबा द्या आणि प्रशासनाला उत्तरदायी बनवा:\n${shareUrl}`;
    xText = `🚨 ${displayTitle}\n📍 ${fullLocation}\n👥 ${raiseCount} नागरिक पाठिंबा (Tier ${currentTier}/5) #CivicAction #RAISE`;
    emailSubject = `नागरिक समस्या पाठपुरावा: ${displayTitle}`;
    emailBody = `सस्नेह नमस्कार,\n\nमी RAISE व्यासपीठावर नोंदवलेली ही महत्त्वाची नागरी समस्या आपल्या निदर्शनास आणू इच्छितो:\n\nशीर्षक: ${displayTitle}\nस्थान: ${fullLocation}\nसध्याचा पाठिंबा: ${raiseCount} नागरिक (Escalation Tier: ${currentTier}/5)\n\nकृपया या लिंकवर जाऊन पाठिंबा द्या आणि प्रशासनाकडून तातडीने निवारण व्हावे यासाठी आवाज उठवा:\n${shareUrl}\n\nधन्यवाद!`;
  } else if (language === 'hi') {
    shareText = `🚨 *${displayTitle}*\n📍 ${fullLocation}\n👥 ${raiseCount} नागरिकों ने समर्थन दिया है (Tier ${currentTier}/5).\n\nRAISE पर इस समस्या को समर्थन दें और प्रशासन को उत्तरदायी बनाएं:\n${shareUrl}`;
    xText = `🚨 ${displayTitle}\n📍 ${fullLocation}\n👥 ${raiseCount} नागरिक समर्थन (Tier ${currentTier}/5) #CivicAction #RAISE`;
    emailSubject = `नागरिक समस्या समाधान: ${displayTitle}`;
    emailBody = `नमस्ते,\n\nमैं RAISE प्लेटफॉर्म पर दर्ज यह महत्वपूर्ण नागरिक समस्या साझा कर रहा हूँ:\n\nशीर्षक: ${displayTitle}\nस्थान: ${fullLocation}\nसमर्थन: ${raiseCount} नागरिक (Tier: ${currentTier}/5)\n\nकृपया नीचे दिए गए लिंक पर जाकर समर्थन दें और प्रशासन से समाधान की मांग करें:\n${shareUrl}\n\nधन्यवाद!`;
  } else {
    shareText = `🚨 *${displayTitle}*\n📍 ${fullLocation}\n👥 Supported by ${raiseCount} citizens (Escalation Tier ${currentTier}/5).\n\nSupport this civic grievance on RAISE to demand statutory resolution:\n${shareUrl}`;
    xText = `🚨 ${displayTitle}\n📍 ${fullLocation}\n👥 ${raiseCount} citizen raises (Tier ${currentTier}/5) #CivicAction #RAISE`;
    emailSubject = `Civic Grievance: ${displayTitle}`;
    emailBody = `Hello,\n\nI want to highlight this civic grievance posted on RAISE:\n\nIssue: ${displayTitle}\nLocation: ${fullLocation}\nSupport: ${raiseCount} citizen raises (Escalation Tier: ${currentTier}/5)\n\nPlease visit the link below to raise your support and demand statutory accountability:\n${shareUrl}\n\nThank you!`;
  }

  // Handle Copy to Clipboard
  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  // Handle Native Web Share API
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: `${displayTitle} - ${fullLocation} (${raiseCount} raises)`,
          url: shareUrl,
        });
      } catch (err: any) {
        // User cancelled or aborted, ignore error
        if (err?.name !== 'AbortError') {
          console.error('Error in navigator.share:', err);
        }
      }
    }
  };

  const platforms = [
    {
      id: 'whatsapp',
      name: t('shareWhatsApp'),
      shortName: 'WhatsApp',
      icon: WhatsAppIcon,
      bgColor: 'bg-emerald-500 hover:bg-emerald-600',
      textColor: 'text-white',
      badge: t('popularBadge'),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    },
    {
      id: 'twitter',
      name: t('shareTwitter'),
      shortName: 'X / Twitter',
      icon: TwitterXIcon,
      bgColor: 'bg-slate-900 hover:bg-black',
      textColor: 'text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: 'telegram',
      name: t('shareTelegram'),
      shortName: 'Telegram',
      icon: TelegramIcon,
      bgColor: 'bg-sky-500 hover:bg-sky-600',
      textColor: 'text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      id: 'facebook',
      name: t('shareFacebook'),
      shortName: 'Facebook',
      icon: FacebookIcon,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: 'linkedin',
      name: t('shareLinkedIn'),
      shortName: 'LinkedIn',
      icon: LinkedInIcon,
      bgColor: 'bg-[#0077B5] hover:bg-[#006097]',
      textColor: 'text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: 'email',
      name: t('shareEmail'),
      shortName: 'Email',
      icon: Mail,
      bgColor: 'bg-rose-600 hover:bg-rose-700',
      textColor: 'text-white',
      url: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100/80 text-blue-700">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t('shareModalTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {t('shareModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            aria-label={t('closeModal')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Grievance Preview Card */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold uppercase tracking-wider">
                {issue.category || 'Civic'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[11px] font-bold">
                Tier {currentTier}/5 Escalation
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
              {displayTitle}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/50">
              <span className="flex items-center gap-1 truncate max-w-[70%]">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{fullLocation}</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-700 shrink-0">
                <ThumbsUp className="w-3.5 h-3.5" />
                {raiseCount} {language === 'mr' ? 'नागरिक' : language === 'hi' ? 'नागरिक' : 'raises'}
              </span>
            </div>
          </div>

          {/* Social Platforms Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              {language === 'mr' ? 'माध्यम निवडा' : language === 'hi' ? 'माध्यम चुनें' : 'Choose Platform'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {platforms.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative flex items-center gap-2.5 p-3 rounded-xl ${platform.bgColor} ${platform.textColor} font-semibold text-xs sm:text-sm transition-all duration-150 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group`}
                  >
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="truncate">{platform.shortName}</span>
                    {platform.badge && (
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[9px] font-extrabold rounded-full shadow-xs border border-white">
                        {platform.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Native Web Share API (if supported on mobile / modern browsers) */}
          {canNativeShare && (
            <div>
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs hover:shadow-md active:scale-[0.99]"
              >
                <Smartphone className="w-4 h-4" />
                <span>{t('shareNativeDevice')}</span>
              </button>
            </div>
          )}

          {/* 1-Tap Copy Link Bar */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('copyLink')}
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2.5 text-xs text-slate-700 select-all outline-hidden font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'mr' ? 'कॉपी झाले ✓' : language === 'hi' ? 'कॉपी हुआ ✓' : 'Copied ✓'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'mr' ? 'कॉपी' : language === 'hi' ? 'कॉपी' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                {t('linkCopied')}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {language === 'mr'
                ? 'अधिक शेअरिंगमुळे प्रशासकीय लक्ष वेधले जाते'
                : language === 'hi'
                ? 'अधिक शेयरिंग से प्रशासनिक ध्यान आकर्षित होता है'
                : 'Shares directly trigger escalation alerts'}
            </span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition"
          >
            {t('closeModal')}
          </button>
        </div>
      </div>
    </div>
  );
}
