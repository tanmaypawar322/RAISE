'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Mic, MicOff, Camera, MapPin, Building, ShieldCheck, Check, AlertCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { compressImage } from '../lib/image-compress';

interface RaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (issue: any) => void;
}

export function RaiseModal({ isOpen, onClose, onIssueCreated }: RaiseModalProps) {
  const { t, language } = useLanguage();
  const { token, requestPhoneOtp } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('roads');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [locationName, setLocationName] = useState('Nigdi, Ward 12');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photo & Low-Bandwidth Compression (Phase 6)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Suggested Office from Backend (Phase 1 Routing)
  const [suggestedOffice, setSuggestedOffice] = useState<{
    officeId: string;
    officeName: string;
    officeNameMr?: string;
    officeNameHi?: string;
    jurisdictionName?: string;
    slaHours?: number;
    confidence?: string;
  } | null>(null);

  // Similar Issues / Duplicate Detection (Phase 2)
  const [similarIssues, setSimilarIssues] = useState<any[]>([]);
  const [selectedDuplicateOf, setSelectedDuplicateOf] = useState<string | null>(null);

  // Guest / Anonymous phone OTP states (Phase 6)
  const [guestPhone, setGuestPhone] = useState('');
  const [guestOtp, setGuestOtp] = useState('');
  const [guestOtpSent, setGuestOtpSent] = useState(false);
  const [guestCooldown, setGuestCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Phase 6: Draft Persistence & Recovery
  React.useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('raise_issue_draft_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title && !title) setTitle(parsed.title);
        if (parsed.description && !description) setDescription(parsed.description);
        if (parsed.category) setCategory(parsed.category);
        setDraftRestored(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    if (title || description) {
      try {
        localStorage.setItem(
          'raise_issue_draft_v1',
          JSON.stringify({ title, description, category, isAnonymous })
        );
      } catch {}
    }
  }, [title, description, category, isAnonymous, isOpen]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCompressing(true);
      setError(null);
      try {
        const compressed = await compressImage(file);
        setSelectedPhoto(compressed);
        setPhotoPreview(URL.createObjectURL(compressed));
      } catch (err: any) {
        setError('Failed to process image');
      } finally {
        setCompressing(false);
      }
    }
  };

  // Sync default location on mount/language
  React.useEffect(() => {
    setLocationName(language === 'mr' ? 'निगडी, प्रभाग १२' : language === 'hi' ? 'निगडी, वार्ड १२' : 'Nigdi, Ward 12');
  }, [language]);

  // Fetch suggested office from backend when category changes
  React.useEffect(() => {
    let isMounted = true;
    const fetchSuggestion = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/suggest-office`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: [73.7842, 18.6508], // Nigdi Ward 12
            category,
          }),
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          setSuggestedOffice(data);
        }
      } catch {
        // Fallback silently
      }
    };

    fetchSuggestion();
    return () => {
      isMounted = false;
    };
  }, [category]);

  // Similar Issues (Duplicate Detection) debounce check (Phase 2)
  React.useEffect(() => {
    const textQuery = `${title} ${description}`.trim();
    if (!textQuery || textQuery.length < 5) {
      setSimilarIssues([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const textParam = encodeURIComponent(textQuery);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/similar?lat=18.6508&lng=73.7842&category=${category}&text=${textParam}&radiusMeters=200`
        );
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.similarIssues)) {
          setSimilarIssues(data.similarIssues);
          if (data.similarIssues.length > 0 && !selectedDuplicateOf) {
            setSelectedDuplicateOf(data.similarIssues[0]._id);
          }
        }
      } catch {
        // Silently ignore
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description, category]);

  const handleRaiseSimilarInstead = async (issueId: string) => {
    if (!token) {
      setError(t('authRequiredNotice'));
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${issueId}/raise`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        onClose();
      } else {
        setError(data.message || 'Failed to support grievance.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (guestCooldown <= 0) return;
    const timer = setInterval(() => {
      setGuestCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [guestCooldown]);

  const handleRequestGuestOtp = async () => {
    if (guestPhone.length !== 10) {
      setError(t('phoneInvalidMsg'));
      return;
    }
    setError(null);
    setIsSendingOtp(true);
    try {
      const res = await requestPhoneOtp(`+91${guestPhone}`, undefined, 'auth');
      if (res.success) {
        setGuestOtpSent(true);
        setGuestCooldown(60);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'roads', label: t('roads') },
    { id: 'water', label: t('water') },
    { id: 'sanitation', label: t('sanitation') },
    { id: 'health', label: t('health') },
    { id: 'electricity', label: t('electricity') },
    { id: 'other', label: t('other') },
  ];

  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setHasVoiceNote(true);
      }, 3000); // 3 sec voice recording simulation
    } else {
      setIsRecording(false);
      setHasVoiceNote(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      if (guestPhone.length !== 10) {
        setError(t('phoneInvalidMsg'));
        return;
      }
      if (guestOtp.length !== 6) {
        setError(t('otpIncompleteMsg'));
        return;
      }
    }

    setLoading(true);

    const newIssuePayload = {
      _id: `issue_${Date.now()}`,
      title: title || (language === 'mr' ? 'पाणी पुरवठा अनियमितता आणि कमी दाबाने पाणी येणे' : 'Irregular water supply and low pressure'),
      titleMr: 'पाणी पुरवठा अनियमितता आणि कमी दाबाने पाणी येणे',
      description:
        description ||
        (language === 'mr'
          ? 'गेल्या ३ दिवसांपासून नळाला पाणी आलेले नाही. यामुळे परिसरातील नागरिकांना पाण्यासाठी वणवण करावी लागत आहे.'
          : 'No tap water for the past 3 days. Residents are facing immense difficulty and having to rely on private tankers.'),
      descriptionMr:
        'गेल्या ३ दिवसांपासून नळाला पाणी आलेले नाही. यामुळे परिसरातील नागरिकांना पाण्यासाठी वणवण करावी लागत आहे.',
      category,
      location: {
        address: locationName,
        ward: language === 'mr' ? 'प्रभाग १२' : 'Ward 12',
        city: language === 'mr' ? 'पिंपरी-चिंचवड' : 'Pimpri-Chinchwad',
      },
      office: {
        name:
          category === 'water'
            ? 'PCMC Water Supply & Drainage Department'
            : "PCMC Ward 'A' Zonal Office",
        nameMr:
          category === 'water'
            ? 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग'
            : 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय',
        claimStatus: 'unclaimed',
      },
      media: hasVoiceNote
        ? [{ type: 'voice_note', url: '#' }]
        : [
            {
              type: 'photo',
              url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
            },
          ],
      status: 'submitted',
      raiseCount: 1,
      createdAt: new Date().toISOString(),
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (selectedPhoto) {
        const formData = new FormData();
        formData.append('title', newIssuePayload.title);
        formData.append('description', newIssuePayload.description);
        formData.append('category', category);
        formData.append('officeId', suggestedOffice?.officeId || '65f000000000000000000001');
        formData.append('latitude', '18.6508');
        formData.append('longitude', '73.7842');
        formData.append('ward', suggestedOffice?.jurisdictionName || 'Ward 12');
        formData.append('city', 'Pimpri-Chinchwad');
        formData.append('isAnonymous', (!token ? true : isAnonymous).toString());
        if (selectedDuplicateOf) formData.append('possibleDuplicateOf', selectedDuplicateOf);
        if (!token) {
          formData.append('phone', `+91${guestPhone}`);
          formData.append('otp', guestOtp);
        }
        formData.append('media', selectedPhoto);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(resData.message || 'Failed to submit grievance');
          setLoading(false);
          return;
        }
      } else {
        const bodyData: any = {
          title: newIssuePayload.title,
          description: newIssuePayload.description,
          category,
          officeId: suggestedOffice?.officeId || '65f000000000000000000001',
          latitude: 18.6508,
          longitude: 73.7842,
          ward: suggestedOffice?.jurisdictionName || 'Ward 12',
          city: 'Pimpri-Chinchwad',
          isAnonymous: !token ? true : isAnonymous,
          possibleDuplicateOf: selectedDuplicateOf || undefined,
        };

        if (!token) {
          bodyData.phone = `+91${guestPhone}`;
          bodyData.otp = guestOtp;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues`, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyData),
        });

        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(resData.message || 'Failed to submit grievance');
          setLoading(false);
          return;
        }
      }
    } catch {
      // Allow optimistic fallback in offline/dev preview
    }

    try {
      localStorage.removeItem('raise_issue_draft_v1');
    } catch {}
    setDraftRestored(false);

    onIssueCreated(newIssuePayload);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
            {t('citizenVoiceBadge')}
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">
            {t('newIssueModalTitle')}
          </h2>
        </div>

        {draftRestored && (
          <div className="mb-3 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-[11px] text-orange-800 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>
                {language === 'mr'
                  ? 'मागील सत्रातील मसुदा पुनर्प्राप्त केला'
                  : language === 'hi'
                  ? 'पिछले सत्र से ड्राफ्ट पुनर्प्राप्त किया गया'
                  : 'Draft restored from your last session'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('raise_issue_draft_v1');
                } catch {}
                setTitle('');
                setDescription('');
                setDraftRestored(false);
              }}
              className="text-orange-900 underline text-[10px] hover:text-orange-700 cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('categoryLabel')} *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition ${
                    category === cat.id
                      ? 'border-orange-600 bg-orange-50 text-orange-900'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('issueTitleLabel')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('issueTitlePlaceholder')}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('issueDescLabel')} *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('issueDescPlaceholder')}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Duplicate Detection Alert (Phase 2) */}
          {similarIssues.length > 0 && (
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {t('possibleDuplicatesDetectedTitle')}
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                  {similarIssues.length} found
                </span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                {t('possibleDuplicatesDetectedDesc')}
              </p>
              <div className="space-y-1.5 pt-1">
                {similarIssues.map((sim) => (
                  <div
                    key={sim._id}
                    className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between gap-2 text-xs shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-gray-900 block truncate">{sim.title}</span>
                      <span className="text-[10px] text-gray-500">
                        {sim.distanceMeters}m away &bull; {sim.raiseCount} {t('raiseCountText')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRaiseSimilarInstead(sim._id)}
                      disabled={loading}
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition shadow-2xs cursor-pointer"
                    >
                      {t('raiseThisInsteadBtn')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Note & Photo Upload Bar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                isRecording
                  ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                  : hasVoiceNote
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 text-red-600" />
                  <span>{t('recording')}</span>
                </>
              ) : hasVoiceNote ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{t('voiceNoteAttached')}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-orange-600" />
                  <span>{t('recordVoiceNote')}</span>
                </>
              )}
            </button>

            <label
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                selectedPhoto
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Camera className="w-4 h-4 text-orange-600" />
              <span>
                {compressing
                  ? 'Compressing...'
                  : selectedPhoto
                  ? 'Photo Added ✓'
                  : t('uploadPhoto')}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={compressing}
                className="hidden"
              />
            </label>
          </div>

          {photoPreview && (
            <div className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                />
                <div>
                  <div className="text-[11px] font-bold text-gray-800">
                    Photo Compressed (2G/3G Ready)
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {selectedPhoto ? `${(selectedPhoto.size / 1024).toFixed(0)} KB (target ≤ 400KB)` : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  setPhotoPreview(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Auto-detected GPS Location */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <span className="font-semibold text-gray-800">{t('detectedLocation')} </span>
                <span className="text-gray-600">{locationName}</span>
              </div>
            </div>
          </div>

          {/* Suggested Authority Target & SLA Clock */}
          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-700 shrink-0" />
              <div>
                <span className="font-semibold text-orange-950">{t('suggestedOfficeLabel')} </span>
                <span className="text-orange-900 font-medium">
                  {suggestedOffice?.officeName || t('suggestedOfficeFallback')}
                </span>
                {suggestedOffice?.jurisdictionName && (
                  <span className="text-orange-700 text-[11px] block">
                    ({suggestedOffice.jurisdictionName})
                  </span>
                )}
              </div>
            </div>
            {suggestedOffice?.slaHours && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300 shrink-0">
                ⚡ {suggestedOffice.slaHours}h SLA
              </span>
            )}
          </div>

          {/* Guest Verification (When Not Signed In) */}
          {!token && (
            <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200 space-y-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-950 font-medium leading-relaxed">
                  {t('guestVerificationNotice')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    {t('enterPhone')} *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2 py-1.5 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-xs font-semibold text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-r-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    {t('enterOtp')} *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      maxLength={6}
                      value={guestOtp}
                      onChange={(e) => setGuestOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRequestGuestOtp}
                      disabled={guestPhone.length !== 10 || isSendingOtp || guestCooldown > 0}
                      className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium shrink-0 disabled:opacity-50 transition"
                    >
                      {isSendingOtp ? '...' : guestCooldown > 0 ? `${guestCooldown}s` : t('sendOtp')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Anonymous Toggle (For Signed In Users) */}
          {token && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="anonToggle"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
              />
              <label htmlFor="anonToggle" className="text-xs text-gray-700 cursor-pointer font-medium">
                {t('postAnonymously')}
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
            >
              {loading ? t('publishingIssue') : t('submitIssue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
