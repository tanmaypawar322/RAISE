'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { Header } from '../components/Header';
import { BottomNav, AppTab } from '../components/BottomNav';
import { IssueCard, IssueItem } from '../components/IssueCard';
import { RaiseModal } from '../components/RaiseModal';
import { NotificationPreferencesSection } from '../components/NotificationPreferencesSection';
import {
  Plus,
  Flame,
  MapPin,
  Sparkles,
  FileText,
  ThumbsUp,
  Settings,
  Clock,
  Briefcase,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Search,
  X,
  Grid,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Wifi,
  Navigation,
} from 'lucide-react';

const initialSampleIssues: IssueItem[] = [
  {
    _id: 'sample_1',
    title: 'Hazardous potholes and severe waterlogging outside Akurdi Railway Station',
    titleMr: 'आकुर्डी रेल्वे स्टेशन समोरील रस्त्यावर धोकादायक खड्डे व तुंबलेले पाणी',
    description:
      'For the past two weeks, rainwater has accumulated on the main road outside the station, causing large potholes. Multiple two-wheeler riders have suffered injuries. Urgent asphalt resurfacing required.',
    descriptionMr:
      'गेल्या २ आठवड्यांपासून स्टेशन परिसरातील मुख्य रस्त्यावर पावसाचे पाणी तुंबून मोठे खड्डे पडले आहेत. दुचाकी घसरून अनेक नागरिक जखमी झाले आहेत. तातडीने डांबरीकरण आवश्यक आहे.',
    category: 'roads',
    location: {
      ward: 'Ward 10 (Akurdi)',
      landmark: 'Near Akurdi Railway Station East Gate',
      city: 'Pimpri-Chinchwad',
      address: 'Near Akurdi Railway Station East Gate',
      coordinates: [73.774, 18.648],
    },
    office: {
      name: 'PCMC Road Maintenance & Civil Department',
      nameMr: 'पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग',
      claimStatus: 'unclaimed',
    },
    media: [
      {
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      },
    ],
    status: 'submitted',
    raiseCount: 84,
    createdAt: '2026-10-07T05:00:00.000Z',
  },
  {
    _id: 'sample_2',
    title: 'Irregular drinking water supply and low pressure in Nigdi Sector 24',
    titleMr: 'निगडी सेक्टर २४ मध्ये गेल्या ३ दिवसांपासून पिण्याच्या पाण्याचा अनियमित पुरवठा',
    description:
      'Water arrives for only 15 minutes each morning with low pressure and muddy quality. Senior citizens and families are dependent on private water tankers. Immediate pipeline pressure inspection requested.',
    descriptionMr:
      'सकाळी फक्त १५ मिनिटे कमी दाबाने गढूळ पाणी येत आहे. परिसरातील ज्येष्ठ नागरिक व कुटुंबांना टँकरवर अवलंबून राहावे लागत आहे. दुरुस्ती व दाबाची पाहणी करावी.',
    category: 'water',
    location: {
      ward: 'Ward 12 (Nigdi Pradhikaran)',
      landmark: 'Near Sambhaji Chowk, Sector 24',
      city: 'Pimpri-Chinchwad',
      address: 'Sector 24, Nigdi',
      coordinates: [73.7842, 18.6508],
    },
    office: {
      name: 'PCMC Water Supply & Drainage Department',
      nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
      claimStatus: 'unclaimed',
    },
    media: [
      {
        type: 'voice_note',
        url: '#',
      },
    ],
    status: 'acknowledged',
    raiseCount: 142,
    createdAt: '2026-10-06T10:00:00.000Z',
  },
  {
    _id: 'sample_3',
    title: 'Garbage dump and foul odor near Chinchwad Station vegetable market',
    titleMr: 'चिंचवड स्टेशन भाजी मंडई जवळ कचऱ्याचे ढीग, दुर्गंधी व डासांचा प्रादुर्भाव',
    description:
      'Daily vegetable market waste is dumped openly along the access road, raising severe public health hazards, foul odor, and mosquito infestation. Daily municipal clearing schedule needed.',
    descriptionMr:
      'दररोज भाजी मंडईतील कचरा रस्त्यावर उघड्यावर टाकल्यामुळे परिसरात साथीचे आजार पसरण्याची भीती निर्माण झाली आहे.',
    category: 'sanitation',
    location: {
      ward: 'Ward 18 (Chinchwad)',
      landmark: 'Vegetable Market Road, Near Chinchwad Station',
      city: 'Pimpri-Chinchwad',
      address: 'Vegetable Market Road, Chinchwad',
      coordinates: [73.789, 18.628],
    },
    office: {
      name: 'PCMC Health & Sanitation Department',
      nameMr: 'पिं.चिं.म.न.पा. मुख्य आरोग्य व घनकचरा व्यवस्थापन विभाग',
      claimStatus: 'unclaimed',
    },
    media: [],
    status: 'in_progress',
    raiseCount: 67,
    createdAt: '2026-10-05T12:00:00.000Z',
  },
];

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const pilotOfficesList = [
  {
    id: '1',
    name: "PCMC Ward 'A' Zonal Office",
    nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय (निगडी, आकुर्डी, प्राधिकरण)',
    level: 'Ward Level',
    claimStatus: 'unclaimed',
    issuesTotal: 18,
    issuesResolved: 7,
    responseRate: '38%',
  },
  {
    id: '2',
    name: 'PCMC Water Supply & Drainage Department',
    nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
    level: 'Municipal Corporation',
    claimStatus: 'claimed',
    issuesTotal: 42,
    issuesResolved: 19,
    responseRate: '45%',
  },
  {
    id: '3',
    name: 'PCMC Road Maintenance & Civil Department',
    nameMr: 'पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग',
    level: 'Municipal Corporation',
    claimStatus: 'claimed',
    issuesTotal: 31,
    issuesResolved: 12,
    responseRate: '39%',
  },
  {
    id: '4',
    name: 'PCMC Health & Sanitation Department',
    nameMr: 'पिं.चिं.म.न.पा. मुख्य आरोग्य व घनकचरा व्यवस्थापन विभाग',
    level: 'Municipal Corporation',
    claimStatus: 'unclaimed',
    issuesTotal: 24,
    issuesResolved: 14,
    responseRate: '58%',
  },
  {
    id: '5',
    name: 'MSEDCL Pimpri Division (Mahavitaran)',
    nameMr: 'महावितरण पिंपरी विभाग (विद्युत पुरवठा)',
    level: 'State Utility',
    claimStatus: 'unclaimed',
    issuesTotal: 15,
    issuesResolved: 9,
    responseRate: '60%',
  },
];

export default function HomePage() {
  const { t, language } = useLanguage();
  const {
    openAuthModal,
    openAuthModalWithAction,
    pendingAction,
    clearPendingAction,
    user,
    logout,
    token,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [issues, setIssues] = useState<IssueItem[]>(initialSampleIssues);
  const [feedFilter, setFeedFilter] = useState<'trending' | 'nearMe'>('trending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);

  // Phase 3 Discovery & Cursor Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('trending');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(initialSampleIssues.length);

  // Office action state
  const [selectedOfficeIssue, setSelectedOfficeIssue] = useState<any | null>(null);
  const [officeStatusUpdate, setOfficeStatusUpdate] = useState<'acknowledged' | 'in_progress' | 'resolved' | 'rejected'>('acknowledged');
  const [officialNote, setOfficialNote] = useState('');

  // Admin escalation copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Automatically switch tab when an official or admin logs in
  useEffect(() => {
    if (user?.role === 'official') {
      setActiveTab('office_portal');
    } else if (user?.role === 'admin') {
      setActiveTab('admin');
    }
  }, [user]);

  // Resume original intent when visitor authenticates
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === 'raise_issue') {
        setIsRaiseModalOpen(true);
      } else if (pendingAction.type === 'view_dashboard') {
        setActiveTab('my_issues');
      }
      clearPendingAction();
    }
  }, [user, pendingAction]);

  const handleRaiseIssueClick = () => {
    if (!user) {
      openAuthModalWithAction({ type: 'raise_issue' });
    } else {
      setIsRaiseModalOpen(true);
    }
  };

  // Search debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Live API fetch with search, filters and sorting
  useEffect(() => {
    let isMounted = true;
    setIsInitialLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.append('q', debouncedSearch.trim());
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    params.append('sort', sortOption === 'nearest' ? 'trending' : sortOption);
    params.append('limit', '20');

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues?${params.toString()}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setIsInitialLoading(false);
        if (data.success && Array.isArray(data.issues)) {
          const mapped: IssueItem[] = data.issues.map((it: any) => ({
            _id: it._id,
            title: it.title,
            description: it.description,
            category: it.category,
            location: it.location || {},
            office: it.officeId,
            media: it.media,
            status: it.status,
            raiseCount: it.raiseCount,
            createdAt: it.createdAt,
          }));
          setIssues(
            mapped.length > 0 ? mapped : debouncedSearch ? [] : initialSampleIssues
          );
          setNextCursor(data.nextCursor || null);
          setHasMore(!!data.hasMore);
          setTotalCount(data.total !== undefined ? data.total : mapped.length);
        }
      })
      .catch(() => {
        if (isMounted) setIsInitialLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedCategory, selectedStatus, sortOption]);

  const handleSortChange = (newSort: string) => {
    if (newSort === 'nearest') {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        setGeoNotice(t('locationPermissionDenied'));
        setSortOption('trending');
        return;
      }
      setIsLocating(true);
      setGeoNotice(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSortOption('nearest');
        },
        () => {
          setIsLocating(false);
          setGeoNotice(t('locationPermissionDenied'));
          setSortOption('trending');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGeoNotice(null);
      setSortOption(newSort);
    }
  };

  const displayedIssues = React.useMemo(() => {
    if (sortOption === 'nearest' && userCoords) {
      return [...issues]
        .map((it) => {
          const coords = it.location?.coordinates;
          const dist =
            coords && coords[0] && coords[1]
              ? calculateDistanceMeters(userCoords.lat, userCoords.lng, coords[1], coords[0])
              : 9999999;
          return { item: it, dist };
        })
        .sort((a, b) => a.dist - b.dist)
        .map((obj) => ({
          ...obj.item,
          _calculatedDist: obj.dist < 9999999 ? obj.dist : undefined,
        }));
    }
    return issues;
  }, [issues, sortOption, userCoords]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.append('q', debouncedSearch.trim());
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    params.append('sort', sortOption === 'nearest' ? 'trending' : sortOption);
    params.append('limit', '20');
    params.append('cursor', nextCursor);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues?${params.toString()}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.issues)) {
        const mapped: IssueItem[] = data.issues.map((it: any) => ({
          _id: it._id,
          title: it.title,
          description: it.description,
          category: it.category,
          location: it.location,
          office: it.officeId,
          media: it.media,
          status: it.status,
          raiseCount: it.raiseCount,
          createdAt: it.createdAt,
        }));
        setIssues((prev) => [...prev, ...mapped]);
        setNextCursor(data.nextCursor || null);
        setHasMore(!!data.hasMore);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleIssueCreated = (newIssue: IssueItem) => {
    setIssues((prev) => [newIssue, ...prev]);
    setActiveTab('home');
  };

  const handleOfficeActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficeIssue) return;
    setIssues((prev) =>
      prev.map((it) => (it._id === selectedOfficeIssue._id ? { ...it, status: officeStatusUpdate } : it))
    );
    setSelectedOfficeIssue(null);
    setOfficialNote('');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredIssues = issues.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenRaiseModal={handleRaiseIssueClick}
    >

      {/* Pilot Notification Banner */}
      <div className="bg-orange-600 text-white text-xs font-semibold px-4 py-1.5 text-center shadow-xs">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('pilotNotice')}</span>
        </span>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1">
        {/* ============================================================ */}
        {/* TAB 1: HOME / PUBLIC FEED */}
        {/* ============================================================ */}
        {activeTab === 'home' && (
          <div>
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-2xl pl-10 pr-10 py-3 border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={t('clearSearch')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter, Sort & Data Saver Controls Bar */}
            <div className="border-b border-gray-200 pb-3 mb-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Status, Sort & Data Saver Controls */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {/* Data Saver Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setDataSaver(!dataSaver)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                      dataSaver
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Data Saver: Hide photos by default for low-bandwidth 2G/3G connections"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{dataSaver ? 'Data Saver: ON' : 'Data Saver'}</span>
                  </button>

                  {/* Status Filter Dropdown */}
                  <div className="relative">
                    <select
                      aria-label={t('filterStatus')}
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="text-xs bg-white text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
                    >
                      <option value="all">{t('filterAll')}</option>
                      <option value="open">{t('filterOpen')}</option>
                      <option value="in_progress">{t('filterInProgress')}</option>
                      <option value="resolved">{t('filterResolved')}</option>
                      <option value="disputed">{t('filterDisputed')}</option>
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      aria-label={t('sortBy')}
                      value={sortOption}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="text-xs bg-white text-slate-700 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-xs"
                    >
                      <option value="trending">{t('sortTrending')}</option>
                      <option value="nearest">📍 {t('sortNearest')}</option>
                      <option value="newest">{t('sortNewest')}</option>
                      <option value="overdue">{t('sortUrgent')}</option>
                      <option value="recently_updated">{t('sortRecentlyUpdated')}</option>
                    </select>
                  </div>

                  {isLocating && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold animate-pulse">
                      <Navigation className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('locatingMessage')}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 font-medium pl-1 hidden sm:block">
                  {totalCount} {t('showingIssuesCount')}
                </div>
              </div>

              {/* Geo Permission Notice (non-blocking fallback banner) */}
              {geoNotice && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{geoNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeoNotice(null)}
                    className="text-blue-700 hover:text-blue-950 font-bold text-xs cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Category Pill Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t('all')}
              </button>
              {['roads', 'water', 'sanitation', 'health', 'electricity', 'education', 'other'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {t(cat as any) || cat}
                  </button>
                )
              )}
            </div>

            {/* Discovery Feed Grid View */}
            <div>
              {/* Empty State */}
              {displayedIssues.length === 0 && !isInitialLoading && (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs mb-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    {t('noIssuesFound')}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Try adjusting your keywords, category, or status filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                    }}
                    className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition"
                  >
                    {t('clearSearch')}
                  </button>
                </div>
              )}

              {/* 2-Column Responsive Feed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedIssues.map((issue) => (
                  <IssueCard
                    key={issue._id}
                    issue={issue}
                    dataSaver={dataSaver}
                    distanceMeters={(issue as any)._calculatedDist}
                  />
                ))}
              </div>

              {/* Cursor Pagination: Load More Grievances */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-400 transition shadow-xs disabled:opacity-50"
                  >
                    {isLoadingMore && <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />}
                    <span>
                      {isLoadingMore ? t('loadingIssues') : t('loadMoreIssues')}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Floating Action Button (FAB) for Quick Grievance Submission */}
            <button
              type="button"
              onClick={handleRaiseIssueClick}
              aria-label={t('raiseIssueBtn')}
              title={t('raiseIssueBtn')}
              className="fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-40 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-full font-bold text-xs sm:text-sm shadow-2xl hover:shadow-orange-600/40 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-orange-500/20 tracking-wide"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{t('raiseIssueBtn')}</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MY ISSUES (CITIZEN) */}
        {/* ============================================================ */}
        {activeTab === 'my_issues' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">{t('myIssuesAndBackedTitle')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('myIssuesSubtitle')}
                </p>
              </div>
              <button
                onClick={handleRaiseIssueClick}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{t('newIssueBtn')}</span>
              </button>
            </div>

            <div className="space-y-4">
              {issues.slice(0, 2).map((issue) => (
                <div key={issue._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                      {t(issue.category as any) || issue.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        issue.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{issue.status === 'resolved' ? t('statusResolved') : t('statusSubmitted')}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 mb-1">
                    {language === 'mr' && issue.titleMr ? issue.titleMr : issue.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {language === 'mr' && issue.descriptionMr ? issue.descriptionMr : issue.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs">
                    <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                      👥 {issue.raiseCount} {t('raiseCountText')}
                    </span>

                    {issue.status === 'resolved' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert(language === 'mr' ? 'निवारण मान्य केले धन्यवाद!' : language === 'hi' ? 'समाधान स्वीकृत किया गया, धन्यवाद!' : 'Resolution confirmed, thank you!')}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                        >
                          {t('confirmResolution')}
                        </button>
                        <button
                          onClick={() => alert(language === 'mr' ? 'आक्षेप नोंदवला गेला आहे. कार्यालयीन पथक पुन्हा तपासणी करेल.' : language === 'hi' ? 'आपत्ति दर्ज की गई। कार्यालयीन दल पुनः जांच करेगा।' : 'Dispute registered. Official team will re-inspect.')}
                          className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold text-xs"
                        >
                          {t('disputeResolution')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[11px]">{t('waitingForResponse')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PUBLIC OFFICES & SCORECARDS */}
        {/* ============================================================ */}
        {activeTab === 'offices' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs mb-4">
              <h2 className="text-lg font-black text-gray-900">{t('officeScorecard')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('officesSubtitle')}
              </p>
            </div>

            <div className="space-y-3">
              {pilotOfficesList.map((office) => (
                <div
                  key={office.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-orange-300 shadow-xs transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">
                        {language === 'mr' ? office.nameMr : office.name}
                      </h3>
                      <span className="text-[11px] text-gray-500">{office.level}</span>
                    </div>
                    <span
                      className={`self-start sm:self-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        office.claimStatus === 'claimed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {office.claimStatus === 'claimed' ? t('officeClaimed') : t('officeUnclaimed')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <div className="text-[10px] text-gray-500">{t('totalIssues')}</div>
                      <div className="text-sm font-bold text-gray-900">{office.issuesTotal}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <div className="text-[10px] text-gray-500">{t('resolvedIssues')}</div>
                      <div className="text-sm font-bold text-emerald-700">{office.issuesResolved}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl">
                      <div className="text-[10px] text-gray-500">{t('responseRate')}</div>
                      <div className="text-sm font-bold text-orange-600">{office.responseRate}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: OFFICE PORTAL (FOR OFFICIALS) */}
        {/* ============================================================ */}
        {activeTab === 'office_portal' && (
          <div className="space-y-6">
            <section className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-blue-700/60 text-blue-100 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('officialPortalBadge')}</span>
                  </div>
                  <h2 className="text-xl font-black">
                    {language === 'mr' ? 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग' : 'PCMC Water Supply & Drainage Department'}
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {t('assignedOfficer')}: {user?.name || 'Ramesh Patil'}
                  </p>
                </div>
              </div>
            </section>

            <div className="space-y-4">
              <h3 className="font-bold text-base text-gray-900">{t('assignedIssues')}</h3>
              {issues.slice(1, 3).map((issue) => (
                <div key={issue._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {t(issue.category as any) || issue.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {issue.location.ward}, {issue.location.city || (language === 'mr' ? 'पिंपरी-चिंचवड' : 'Pimpri-Chinchwad')}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-gray-900 mb-1">
                    {language === 'mr' && issue.titleMr ? issue.titleMr : issue.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {language === 'mr' && issue.descriptionMr ? issue.descriptionMr : issue.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-orange-600 text-xs">
                      👥 {issue.raiseCount} {t('raiseCountText')}
                    </span>
                    <button
                      onClick={() => setSelectedOfficeIssue(issue)}
                      className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      {t('takeActionBtn')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: ADMIN CONSOLE (FOR ADMINS) */}
        {/* ============================================================ */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <section className="bg-gradient-to-r from-purple-950 to-indigo-950 rounded-3xl p-6 text-white shadow-md">
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
                <span>{t('adminGovernanceBadge')}</span>
              </div>
              <h2 className="text-xl font-black">{t('adminConsoleTitle')}</h2>
              <p className="text-xs text-purple-200 mt-0.5">
                {t('administratorLabel')}: {user?.name || 'Platform Administrator'}
              </p>
            </section>

            {/* Overdue Escalation Watch with CPGRAMS / RTI Generator */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>{t('escalationWatchTitle')}</span>
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                {t('escalationWatchDesc')}
              </p>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900">
                    {language === 'mr'
                      ? 'आकुर्डी रेल्वे स्टेशन खड्डे व पाणी (३ दिवस प्रतिसाद नाही)'
                      : language === 'hi'
                      ? 'आकुर्डी रेलवे स्टेशन गड्ढे और जलजमाव (३ दिन कोई प्रतिक्रिया नहीं)'
                      : 'Akurdi Railway Station Potholes (3 Days Overdue)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText('cpg', 'To Public Grievance Officer, PCMC...')}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 transition"
                    >
                      {copiedId === 'cpg' ? t('copiedText') : t('copyCpgrams')}
                    </button>
                    <button
                      onClick={() => handleCopyText('rti', 'Application under Section 6(1) RTI Act 2005...')}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 transition"
                    >
                      {copiedId === 'rti' ? t('copiedText') : t('copyRti')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: PROFILE & SETTINGS */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs max-w-xl mx-auto">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              {t('profileSettingsTab')}
            </h2>

            {user ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold block mb-0.5">{t('fullName')}:</span>
                  <span className="text-sm font-bold text-gray-900">{user.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block mb-0.5">{t('email')}:</span>
                  <span className="text-sm font-bold text-gray-900">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block mb-0.5">{t('accountType')}:</span>
                  <span className="text-xs uppercase font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>

                {/* Phase 4: Notification Preferences */}
                <NotificationPreferencesSection />

                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold transition text-xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('signOutBtn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500 mb-4">{t('notSignedInNote')}</p>
                <button
                  onClick={() => openAuthModal()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {t('signIn')}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white/90 py-6 px-4 text-xs text-gray-500 text-center mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-semibold text-slate-700">&copy; 2026 RAISE</span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span>LokAwaaz Non-Profit Civic Grievance Platform</span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="text-emerald-700 font-medium">DPDP Act 2023 Compliant</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <Link href="/how-it-works" className="text-gray-600 hover:text-orange-600 underline transition">
              How it Works
            </Link>
            <Link href="/community-guidelines" className="text-gray-600 hover:text-orange-600 underline transition">
              Community Guidelines
            </Link>
            <Link href="/transparency/moderation" className="text-gray-600 hover:text-orange-600 underline transition">
              Transparency Log
            </Link>
            <Link href="/report-content" className="text-gray-600 hover:text-orange-600 underline transition">
              Report Content
            </Link>
            <Link href="/grievance-officer" className="text-gray-600 hover:text-orange-600 underline transition">
              Grievance Officer
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-orange-600 underline transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-orange-600 underline transition">
              Terms of Use
            </Link>
            <Link
              href="/office-portal"
              className="text-blue-700 hover:text-blue-900 underline transition font-bold"
            >
              Office Portal
            </Link>
          </div>
        </div>
      </footer>


      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-20 right-4 z-30 sm:hidden">
        <button
          onClick={handleRaiseIssueClick}
          className="flex items-center gap-1.5 bg-orange-600 text-white px-4 py-3 rounded-full font-bold text-xs shadow-lg hover:bg-orange-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('raiseIssueBtn')}</span>
        </button>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRaiseModal={handleRaiseIssueClick}
      />

      {/* Raise Issue Modal */}
      <RaiseModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onIssueCreated={handleIssueCreated}
      />

      {/* Office Action Modal */}
      {selectedOfficeIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-gray-100 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 mb-1">{t('statusActionTitle')}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedOfficeIssue.title}</p>

            <form onSubmit={handleOfficeActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('selectNewStatus')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfficeStatusUpdate('acknowledged')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      officeStatusUpdate === 'acknowledged'
                        ? 'border-amber-600 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionAcknowledge')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfficeStatusUpdate('in_progress')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      officeStatusUpdate === 'in_progress'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionInProgress')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfficeStatusUpdate('resolved')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      officeStatusUpdate === 'resolved'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionResolved')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfficeStatusUpdate('rejected')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      officeStatusUpdate === 'rejected'
                        ? 'border-red-600 bg-red-50 text-red-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {t('officeActionReject')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('publicNoteLabel')} *</label>
                <textarea
                  rows={3}
                  value={officialNote}
                  onChange={(e) => setOfficialNote(e.target.value)}
                  placeholder={t('publicNotePlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOfficeIssue(null)}
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
    </AppShell>
  );
}
