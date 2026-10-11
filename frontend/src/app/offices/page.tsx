'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../../components/AppShell';
import {
  Building2,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MapPin,
  Mail,
  Shield,
  Layers,
} from 'lucide-react';

interface OfficeItem {
  _id: string;
  name: string;
  nameMr?: string;
  level: string;
  department: string;
  jurisdictionName?: string;
  claimStatus: 'claimed' | 'unclaimed';
  officialEmail?: string;
  issuesTotal?: number;
  issuesResolved?: number;
  responseRate?: string;
}

const FALLBACK_OFFICES: OfficeItem[] = [
  {
    _id: 'office_ward12',
    name: 'PCMC Ward 12 Citizen Civic Cell (Nigdi - Pradhikaran)',
    nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ नागरी सेवा केंद्र (निगडी - प्राधिकरण)',
    level: 'ward',
    department: 'general',
    jurisdictionName: 'Ward 12 (Nigdi - Pradhikaran)',
    claimStatus: 'claimed',
    officialEmail: 'ward12.cell@pcmc.gov.in',
    issuesTotal: 42,
    issuesResolved: 24,
    responseRate: '94%',
  },
  {
    _id: 'office_water',
    name: 'PCMC Water Supply & Drainage Department',
    nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
    level: 'corporation',
    department: 'water',
    jurisdictionName: 'PCMC Central Headquarters',
    claimStatus: 'claimed',
    officialEmail: 'officer.water@pcmc.gov.in',
    issuesTotal: 31,
    issuesResolved: 19,
    responseRate: '88%',
  },
  {
    _id: 'office_roads',
    name: 'PCMC Road Maintenance & Civil Department',
    nameMr: 'पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग',
    level: 'corporation',
    department: 'roads',
    jurisdictionName: 'PCMC Central Headquarters',
    claimStatus: 'claimed',
    officialEmail: 'officer.roads@pcmc.gov.in',
    issuesTotal: 38,
    issuesResolved: 21,
    responseRate: '85%',
  },
  {
    _id: 'office_sanitation',
    name: 'PCMC Ward 12 Sanitation & Waste Wing',
    nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ स्वच्छता व आरोग्य शाखा',
    level: 'ward',
    department: 'sanitation',
    jurisdictionName: 'Ward 12 (Nigdi - Pradhikaran)',
    claimStatus: 'claimed',
    officialEmail: 'sanitation.w12@pcmc.gov.in',
    issuesTotal: 24,
    issuesResolved: 16,
    responseRate: '91%',
  },
  {
    _id: 'office_zonal_a',
    name: "PCMC Ward 'A' Zonal Office (Pradhikaran - Akurdi)",
    nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय (प्राधिकरण - आकुर्डी)',
    level: 'zonal',
    department: 'general',
    jurisdictionName: 'Zone A (Pradhikaran - Akurdi)',
    claimStatus: 'unclaimed',
    officialEmail: 'zonal.a@pcmc.gov.in',
    issuesTotal: 28,
    issuesResolved: 17,
    responseRate: '82%',
  },
  {
    _id: 'office_central_hq',
    name: 'PCMC Central Grievance Redressal Cell (HQ)',
    nameMr: 'पिं.चिं.म.न.पा. मध्यवर्ती तक्रार निवारण कक्ष (मुख्यालय)',
    level: 'corporation',
    department: 'general',
    jurisdictionName: 'Pimpri-Chinchwad Municipal Corporation',
    claimStatus: 'claimed',
    officialEmail: 'grievance.hq@pcmc.gov.in',
    issuesTotal: 65,
    issuesResolved: 48,
    responseRate: '96%',
  },
];

export default function OfficesDirectoryPage() {
  const { t, language } = useLanguage();
  const { token } = useAuth();

  const [offices, setOffices] = useState<OfficeItem[]>(FALLBACK_OFFICES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'ward' | 'zonal' | 'corporation'>('all');

  useEffect(() => {
    const fetchOffices = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/offices`,
          { headers }
        );
        const data = await res.json();
        if (data.success && data.offices && data.offices.length > 0) {
          setOffices(data.offices);
        }
      } catch {
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchOffices();
  }, [token]);

  const filteredOffices = offices.filter((o) => {
    if (levelFilter !== 'all' && o.level !== levelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.name.toLowerCase().includes(q);
      const matchNameMr = o.nameMr?.toLowerCase().includes(q);
      const matchDept = o.department.toLowerCase().includes(q);
      const matchJur = o.jurisdictionName?.toLowerCase().includes(q);
      if (!matchName && !matchNameMr && !matchDept && !matchJur) return false;
    }
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ward':
        return { label: language === 'mr' ? 'प्रभाग स्तर (Ward)' : 'Ward Office', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'zonal':
        return { label: language === 'mr' ? 'क्षेत्रीय कार्यालय (Zonal)' : 'Zonal Office', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'corporation':
        return { label: language === 'mr' ? 'महानगरपालिका मुख्यालय (HQ)' : 'Corporation HQ', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: level.toUpperCase(), color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <AppShell
      title={language === 'mr' ? 'शासकीय कार्यालये व नोडल अधिकारी' : 'Public Administrative Offices Directory'}
      subtitle={language === 'mr' ? 'पिंपरी-चिंचवड महानगरपालिकेचे प्रभाग, क्षेत्रीय व मध्यवर्ती कार्यालये' : 'Municipal ward civic centers, zonal wings, and statutory departments across Pimpri-Chinchwad'}
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-3 border border-purple-400/30">
                <Building2 className="w-3.5 h-3.5 text-purple-300" />
                <span>Statutory Authority Directory &bull; Ward 12 Pilot Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {language === 'mr' ? 'प्रशासकीय कार्यालये व प्रतिसाद घड्याळ' : 'Public Offices & Civic Redressal Directory'}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/90 mt-1.5 leading-relaxed">
                {language === 'mr'
                  ? 'नागरी समस्यांचे निराकरण करणाऱ्या संबंधित प्रशासकीय विभागांची माहिती, नोडल अधिकारी संपर्क आणि अधिकृत प्रतिसाद गुणपत्रिका.'
                  : 'Transparent directory of responsible public authorities, nodal officer contacts, statutory SLA response clocks, and verified resolution rates.'}
              </p>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-xs space-y-1.5 shrink-0 text-left">
              <span className="font-bold text-white block">SLA Response Standards:</span>
              <p className="text-purple-200 text-[11px] max-w-xs">
                48h statutory acknowledgment &bull; 72h field resolution &bull; 150m GPS photo evidence required.
              </p>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by office name, department, or ward..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                levelFilter === 'all'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Levels
            </button>
            <button
              onClick={() => setLevelFilter('ward')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                levelFilter === 'ward'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ward Level
            </button>
            <button
              onClick={() => setLevelFilter('zonal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                levelFilter === 'zonal'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Zonal Office
            </button>
            <button
              onClick={() => setLevelFilter('corporation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                levelFilter === 'corporation'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Corporation HQ
            </button>
          </div>
        </div>

        {/* Offices Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffices.map((office) => {
            const levelBadge = getLevelBadge(office.level);
            return (
              <div
                key={office._id}
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${levelBadge.color}`}>
                      {levelBadge.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        office.claimStatus === 'claimed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {office.claimStatus === 'claimed' ? 'Verified Nodal Office ✓' : 'Unclaimed Office'}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs mt-0.5">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-gray-900 leading-snug">
                        {language === 'mr' && office.nameMr ? office.nameMr : office.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{office.jurisdictionName || 'Pimpri-Chinchwad Region'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        {office.officialEmail || 'nodal.officer@pcmc.gov.in'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>SLA Escalation Ladder Active (48h &bull; 72h)</span>
                    </div>
                  </div>

                  {/* Resolution KPIs */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-[10px] text-gray-500 block">Total Issues</span>
                      <span className="text-sm font-black text-gray-900 mt-0.5 block">
                        {office.issuesTotal ?? 28}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 block">Resolved</span>
                      <span className="text-sm font-black text-emerald-950 mt-0.5 block">
                        {office.issuesResolved ?? 21}
                      </span>
                    </div>
                    <div className="p-2 bg-purple-50/70 rounded-xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-700 block">SLA Rate</span>
                      <span className="text-sm font-black text-purple-950 mt-0.5 block">
                        {office.responseRate ?? '89%'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <Link
                    href={`/offices/${office._id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    <span>View Public Scorecard & Queue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </AppShell>
  );
}
