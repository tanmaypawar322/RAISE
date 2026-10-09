'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { slugifyTitle } from '../lib/slug';
import { MapPin, Navigation, Compass, Layers, AlertCircle, ExternalLink, ThumbsUp } from 'lucide-react';

export interface MapPinIssue {
  _id: string;
  title: string;
  category: string;
  status: string;
  raiseCount: number;
  location?: {
    coordinates: [number, number]; // [lng, lat]
    ward?: string;
    address?: string;
  };
  office?: {
    name: string;
    nameMr?: string;
  };
}

interface IssueMapViewProps {
  issues: MapPinIssue[];
  onSelectIssue?: (issue: MapPinIssue) => void;
}

const WARD_FALLBACKS = [
  { name: 'Ward 12 (Nigdi - Pradhikaran)', lat: 18.6625, lng: 73.7800 },
  { name: 'Ward 10 (Akurdi)', lat: 18.6480, lng: 73.7740 },
  { name: 'Ward 18 (Chinchwad Station)', lat: 18.6280, lng: 73.7890 },
  { name: 'Ward 22 (Pimpri Market)', lat: 18.6250, lng: 73.8050 },
  { name: 'Ward 8 (Bhosari)', lat: 18.6270, lng: 73.8450 },
];

export default function IssueMapView({ issues, onSelectIssue }: IssueMapViewProps) {
  const { t, language } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<MapPinIssue | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    // Dynamically inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Avoid re-initializing if map already exists
      if (mapInstanceRef.current) return;

      // Default centroid: Ward 12 Nigdi / Pradhikaran
      const map = L.map(mapContainerRef.current, {
        center: [18.6625, 73.7800],
        zoom: 14,
        zoomControl: true,
      });

      const tileUrl =
        process.env.NEXT_PUBLIC_MAP_TILE_URL ||
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors | RAISE Civic Platform',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;

      renderPins(L, map, markersGroup, issues, activeCategory);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update pins when issues or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    import('leaflet').then((L) => {
      renderPins(L, mapInstanceRef.current, markersLayerRef.current, issues, activeCategory);
    });
  }, [issues, activeCategory]);

  const renderPins = (
    L: any,
    map: any,
    markersGroup: any,
    issueList: MapPinIssue[],
    catFilter: string
  ) => {
    markersGroup.clearLayers();

    const filtered = catFilter === 'all'
      ? issueList
      : issueList.filter((it) => it.category === catFilter);

    filtered.forEach((issue) => {
      const coords = issue.location?.coordinates;
      if (!coords || !Array.isArray(coords) || coords.length < 2) return;

      const [lng, lat] = coords;
      if (isNaN(lng) || isNaN(lat)) return;

      // Category color scheme
      let pinColor = '#2563eb'; // blue default
      if (issue.category === 'roads') pinColor = '#f59e0b'; // amber
      else if (issue.category === 'water') pinColor = '#0284c7'; // cyan
      else if (issue.category === 'sanitation') pinColor = '#10b981'; // emerald
      else if (issue.category === 'electricity') pinColor = '#8b5cf6'; // purple
      else if (issue.category === 'health') pinColor = '#ef4444'; // red

      const markerHtml = `
        <div style="
          background-color: ${pinColor};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 11px;
            font-weight: bold;
          ">${issue.raiseCount}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedIssue(issue);
        if (onSelectIssue) onSelectIssue(issue);
      });

      markersGroup.addLayer(marker);
    });
  };

  const handleLocateNearMe = () => {
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice(t('geoDeniedNotice'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          // Pan map to user's general area without revealing or recording their exact home
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoNotice(t('geoDeniedNotice'));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectWardFallback = (lat: number, lng: number) => {
    setGeoNotice(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
      {/* Top Controls Bar */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['all', 'roads', 'water', 'sanitation', 'electricity', 'health'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? t('filterAll') : (t(cat as any) || cat)}
            </button>
          ))}
        </div>

        {/* Geo Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateNearMe}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            title={t('locateNearMe')}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? t('locatingUser') : t('locateNearMe')}</span>
          </button>

          {/* Ward Fallback Dropdown */}
          <div className="relative">
            <select
              aria-label={t('selectWardFallback')}
              onChange={(e) => {
                const selected = WARD_FALLBACKS.find((w) => w.name === e.target.value);
                if (selected) handleSelectWardFallback(selected.lat, selected.lng);
              }}
              className="text-xs bg-white text-slate-700 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue=""
            >
              <option value="" disabled>
                {t('selectWardFallback')}
              </option>
              {WARD_FALLBACKS.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Geolocation Notice Banner (if denied) */}
      {geoNotice && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoNotice}</span>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[540px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Selected Issue Preview Card (Docked Bottom Right) */}
        {selectedIssue && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {t(selectedIssue.category as any) || selectedIssue.category}
              </span>
              <button
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            <h4 className="mt-2 text-sm font-semibold text-slate-900 line-clamp-2">
              {selectedIssue.title}
            </h4>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedIssue.location?.ward || 'Pimpri-Chinchwad'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <ThumbsUp className="w-3.5 h-3.5" />
                {selectedIssue.raiseCount} {t('raiseCountText')}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {selectedIssue.office?.name || 'Local Authority'}
              </span>
              <Link
                href={`/issues/${selectedIssue._id}/${slugifyTitle(selectedIssue.title)}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <span>{t('publicDossierTitle')}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
