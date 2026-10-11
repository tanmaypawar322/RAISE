'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Mic, MicOff, Camera, Video, MapPin, Navigation, Building, ShieldCheck, Check, AlertCircle, AlertTriangle, Sparkles, Trash2 } from 'lucide-react';
import { compressImage } from '../lib/image-compress';

export const PILOT_WARDS = [
  { id: 'Ward 12 (Nigdi - Pradhikaran)', labelEn: 'Ward 12 (Nigdi - Pradhikaran)', labelMr: 'प्रभाग १२ (निगडी - प्राधिकरण)', labelHi: 'वार्ड १२ (निगडी - प्राधिकरण)', defaultCoords: [73.7842, 18.6508] },
  { id: 'Ward 10 (Akurdi)', labelEn: 'Ward 10 (Akurdi)', labelMr: 'प्रभाग १० (आकुर्डी)', labelHi: 'वार्ड १० (आकुर्डी)', defaultCoords: [73.7740, 18.6480] },
  { id: 'Ward 18 (Chinchwad Station)', labelEn: 'Ward 18 (Chinchwad Station)', labelMr: 'प्रभाग १८ (चिंचवड स्टेशन)', labelHi: 'वार्ड १८ (चिंचवड स्टेशन)', defaultCoords: [73.7890, 18.6280] },
  { id: 'Ward 22 (Pimpri Market)', labelEn: 'Ward 22 (Pimpri Market)', labelMr: 'प्रभाग २२ (पिंपरी मार्केट)', labelHi: 'वार्ड २२ (पिंपरी मार्केट)', defaultCoords: [73.8050, 18.6250] },
  { id: 'Ward 8 (Bhosari)', labelEn: 'Ward 8 (Bhosari)', labelMr: 'प्रभाग ८ (भोसरी)', labelHi: 'वार्ड ८ (भोसरी)', defaultCoords: [73.8450, 18.6270] },
];

export interface AttachedPhoto {
  id: string;
  file: File;
  preview: string;
  sizeKb: number;
}

export interface AttachedVideo {
  id: string;
  file: File;
  name: string;
  preview: string;
  sizeMb: string;
}

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
  const [landmark, setLandmark] = useState('');
  const [selectedWard, setSelectedWard] = useState('Ward 12 (Nigdi - Pradhikaran)');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState('');
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-Media State: Photos, Videos & Voice Notes
  const [photos, setPhotos] = useState<AttachedPhoto[]>([]);
  const [videos, setVideos] = useState<AttachedVideo[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      videos.forEach((v) => URL.revokeObjectURL(v.preview));
      if (voiceUrl && voiceUrl !== 'mock') URL.revokeObjectURL(voiceUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setCompressing(true);
      setError(null);
      try {
        const newPhotos: AttachedPhoto[] = [];
        for (const file of files) {
          if (!file.type.startsWith('image/')) continue;
          let compressed: File = file;
          try {
            compressed = await compressImage(file);
          } catch {
            compressed = file;
          }
          newPhotos.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            file: compressed,
            preview: URL.createObjectURL(compressed),
            sizeKb: Math.round(compressed.size / 1024),
          });
        }
        setPhotos((prev) => [...prev, ...newPhotos].slice(0, 6)); // Allow up to 6 photos
      } catch {
        setError('Failed to process image');
      } finally {
        setCompressing(false);
        e.target.value = '';
      }
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newVideos: AttachedVideo[] = [];
      for (const file of files) {
        if (!file.type.startsWith('video/')) continue;
        if (file.size > 50 * 1024 * 1024) {
          setError('Video file exceeds 50MB limit');
          continue;
        }
        newVideos.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          preview: URL.createObjectURL(file),
          sizeMb: (file.size / (1024 * 1024)).toFixed(1),
        });
      }
      setVideos((prev) => [...prev, ...newVideos].slice(0, 3)); // Allow up to 3 videos
      e.target.value = '';
    }
  };

  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((v) => v.id !== id);
    });
  };

  const startRecording = async () => {
    setError(null);
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      simulateVoiceNote();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      simulateVoiceNote();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const simulateVoiceNote = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      const dummyBlob = new Blob(['sample audio voice note'], { type: 'audio/webm' });
      setVoiceBlob(dummyBlob);
      setVoiceUrl('mock');
    }, 3000);
  };

  const handleRemoveVoiceNote = () => {
    if (voiceUrl && voiceUrl !== 'mock') URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setRecordingSeconds(0);
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsNotice(t('locationPermissionDenied'));
      return;
    }
    setIsLocating(true);
    setGpsNotice(null);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lat < 8.0 || lat > 37.5 || lng < 68.0 || lng > 97.5) {
          setIsLocating(false);
          setGpsNotice('Coordinates are outside India pilot boundaries.');
          return;
        }
        setCoords({ lat, lng });
        setIsLocating(false);

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/suggest-office`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates: [lng, lat], category }),
          });
          const data = await res.json();
          if (data.success) {
            setSuggestedOffice(data);
            const resolvedWard = data.jurisdictionName || 'Ward 12 (Nigdi - Pradhikaran)';
            setSelectedWard(resolvedWard);
            setLocationFeedback(resolvedWard);
          }
        } catch {
          setLocationFeedback('Ward 12 (Nigdi)');
        }
      },
      () => {
        setIsLocating(false);
        setGpsNotice(t('locationPermissionDenied'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fetch suggested office from backend when category or location changes
  React.useEffect(() => {
    let isMounted = true;
    const fetchSuggestion = async () => {
      try {
        const activeWardObj = PILOT_WARDS.find((w) => w.id === selectedWard);
        const resolvedCoords = coords ? [coords.lng, coords.lat] : activeWardObj ? activeWardObj.defaultCoords : [73.7842, 18.6508];
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/suggest-office`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: resolvedCoords,
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
  }, [category, coords, selectedWard]);

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

    if (!landmark.trim() || landmark.trim().length < 5 || landmark.trim().length > 120) {
      setError(t('landmarkRequiredError'));
      return;
    }

    setLoading(true);

    const localMedia: Array<{ type: string; url: string; filename?: string; mimeType?: string }> = [];
    photos.forEach((p) => localMedia.push({ type: 'photo', url: p.preview, filename: p.file.name, mimeType: p.file.type }));
    videos.forEach((v) => localMedia.push({ type: 'video', url: v.preview, filename: v.name, mimeType: v.file.type }));
    if (voiceBlob) {
      localMedia.push({ type: 'voice_note', url: voiceUrl || '#', filename: 'voice_note.webm', mimeType: 'audio/webm' });
    }
    if (localMedia.length === 0) {
      localMedia.push({
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      });
    }

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
        address: `${landmark.trim()}, ${selectedWard}`,
        landmark: landmark.trim(),
        ward: selectedWard,
        city: language === 'mr' ? 'पिंपरी-चिंचवड' : 'Pimpri-Chinchwad',
        coordinates: coords ? [coords.lng, coords.lat] : [73.7842, 18.6508],
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
      media: localMedia,
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

      const hasMedia = photos.length > 0 || videos.length > 0 || !!voiceBlob;
      if (hasMedia) {
        const formData = new FormData();
        formData.append('title', newIssuePayload.title);
        formData.append('description', newIssuePayload.description);
        formData.append('category', category);
        formData.append('officeId', suggestedOffice?.officeId || '65f000000000000000000001');
        formData.append('landmark', landmark.trim());
        formData.append('ward', selectedWard);
        formData.append('city', 'Pimpri-Chinchwad');
        if (coords) {
          formData.append('latitude', coords.lat.toString());
          formData.append('longitude', coords.lng.toString());
        }
        formData.append('isAnonymous', (!token ? true : isAnonymous).toString());
        if (selectedDuplicateOf) formData.append('possibleDuplicateOf', selectedDuplicateOf);
        if (!token) {
          formData.append('phone', `+91${guestPhone}`);
          formData.append('otp', guestOtp);
        }
        photos.forEach((p) => formData.append('media', p.file));
        videos.forEach((v) => formData.append('media', v.file));
        if (voiceBlob) {
          formData.append('media', voiceBlob, 'voice_note.webm');
        }

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
          landmark: landmark.trim(),
          ward: selectedWard,
          city: 'Pimpri-Chinchwad',
          isAnonymous: !token ? true : isAnonymous,
          possibleDuplicateOf: selectedDuplicateOf || undefined,
        };

        if (coords) {
          bodyData.latitude = coords.lat;
          bodyData.longitude = coords.lng;
        }

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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col my-auto overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
              {t('citizenVoiceBadge')}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
              {t('newIssueModalTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
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

          {/* Multi-Media Proof Attachments (Photos, Videos, Voice Note) */}
          <div className="space-y-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800">
                {language === 'mr'
                  ? 'पुरावे जोडा (फोटो, व्हिडिओ, व्हॉइस नोट)'
                  : language === 'hi'
                  ? 'सबूत जोड़ें (फोटो, वीडियो, वॉयस नोट)'
                  : 'Attach Media Proof (Photos, Videos, Voice Note)'}
              </label>
              <span className="text-[10px] text-gray-500 font-medium">
                {photos.length + videos.length + (voiceBlob ? 1 : 0)} attached
              </span>
            </div>

            {/* 3 Attachment Triggers Bar */}
            <div className="grid grid-cols-3 gap-2">
              {/* Photo Input Button */}
              <label className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border border-gray-300 bg-white hover:bg-orange-50/50 hover:border-orange-300 text-gray-700 text-xs font-semibold cursor-pointer transition text-center shadow-xs">
                <Camera className="w-4 h-4 text-orange-600" />
                <span className="text-[11px] truncate w-full">
                  {compressing
                    ? 'Processing...'
                    : photos.length > 0
                    ? `${photos.length} Photo${photos.length > 1 ? 's' : ''}`
                    : t('uploadPhoto')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                  disabled={compressing}
                  className="hidden"
                />
              </label>

              {/* Video Input Button */}
              <label className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border border-gray-300 bg-white hover:bg-orange-50/50 hover:border-orange-300 text-gray-700 text-xs font-semibold cursor-pointer transition text-center shadow-xs">
                <Video className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] truncate w-full">
                  {videos.length > 0
                    ? `${videos.length} Video${videos.length > 1 ? 's' : ''}`
                    : t('attachVideos')}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideosChange}
                  className="hidden"
                />
              </label>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-semibold transition text-center shadow-xs cursor-pointer ${
                  isRecording
                    ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                    : voiceBlob
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-300 bg-white hover:bg-orange-50/50 hover:border-orange-300 text-gray-700'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 text-red-600" />
                    <span className="text-[11px] font-bold">{`${recordingSeconds}s Stop`}</span>
                  </>
                ) : voiceBlob ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] truncate w-full font-bold">{t('voiceNoteRecorded')}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] truncate w-full">{t('recordVoiceNote')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Attached Photos Preview Grid */}
            {photos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
                  <span>{t('attachedPhotosLabel')} ({photos.length}/6)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-100 shadow-2xs">
                      <img src={p.preview} alt="Attached" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition cursor-pointer shadow-xs"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded font-mono">
                        {p.sizeKb}KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Videos Preview List */}
            {videos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-gray-600">
                  {t('attachedVideosLabel')} ({videos.length}/3)
                </div>
                <div className="space-y-1.5">
                  {videos.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-xl border border-gray-200 bg-white text-xs shadow-2xs">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <Video className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate font-medium text-gray-800">{v.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono shrink-0">({v.sizeMb}MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(v.id)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-lg cursor-pointer shrink-0 ml-2"
                        title="Remove video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Voice Note Audio Bar */}
            {voiceBlob && (
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Mic className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-950 shrink-0 hidden sm:inline">
                    {t('voiceNoteRecorded')}
                  </span>
                  {voiceUrl && voiceUrl !== 'mock' ? (
                    <audio controls src={voiceUrl} className="h-7 w-full max-w-xs" />
                  ) : (
                    <span className="text-xs text-emerald-700 italic">3s audio note</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoiceNote}
                  className="text-emerald-700 hover:text-rose-700 p-1 rounded-lg cursor-pointer shrink-0"
                  title="Remove voice note"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Landmark / Area Description (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                {t('landmarkLabel')} *
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                {landmark.length}/120
              </span>
            </div>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder={t('landmarkPlaceholder')}
              maxLength={120}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              required
            />
            <p className="text-[10px] text-gray-500 mt-1">
              {t('landmarkHelp')}
            </p>
          </div>

          {/* Location Capture: GPS Button & Ward Selector */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-gray-800 block text-xs truncate">
                    {locationFeedback ? t('locationDetected') : t('selectWard')}
                  </span>
                  <span className="text-[11px] text-gray-600 truncate block">
                    {locationFeedback || selectedWard}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-[11px] font-semibold text-gray-700 flex items-center gap-1.5 shrink-0 transition shadow-xs cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? t('locatingMessage') : t('useCurrentLocation')}</span>
              </button>
            </div>

            {/* Ward selector dropdown (for manual selection or fallback) */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 mb-1">
                {t('selectWard')}
              </label>
              <select
                aria-label={t('selectWard')}
                value={selectedWard}
                onChange={(e) => {
                  setSelectedWard(e.target.value);
                  setLocationFeedback('');
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
              >
                {PILOT_WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {language === 'mr' ? w.labelMr : language === 'hi' ? w.labelHi : w.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {gpsNotice && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{gpsNotice}</span>
              </div>
            )}
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
