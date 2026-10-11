'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  BarChart3,
  Building2,
  TrendingUp,
  AlertTriangle,
  Download,
  ShieldCheck,
  ChevronLeft,
  Flame,
  Layers,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

function ExecutiveAnalysisContent() {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'constituencies' | 'bottlenecks' | 'hotspots' | 'sla'>('constituencies');
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/analysis/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();
        setLoading(false);
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Access restricted.');
        }
      } catch {
        setLoading(false);
        setError('Network error loading executive analysis.');
      }
    };
    fetchAnalysis();
  }, [token]);

  const handleExportCsv = async () => {
    if (!token) return;
    setDownloadingCsv(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/analysis/export-csv`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date().toISOString().split('T')[0];
        a.download = `raise-executive-briefing-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Failed to export CSV briefing.');
      }
    } catch {
      alert('Network error downloading CSV.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading scoped executive analysis...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <Header />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-600 mb-6">
            {error || 'This dashboard is reserved for upper-level executive offices, ministries, and district administrators.'}
          </p>
          <Link
            href="/office-portal"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Office Portal</span>
          </Link>
        </main>
      </div>
    );
  }

  const { scope, constituencyBreakdown = [], departmentalBottlenecks = [], hotSpotClusters = [], slaHealth = {} } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/office-portal"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Office Portal</span>
          </Link>

          <button
            onClick={handleExportCsv}
            disabled={downloadingCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingCsv ? 'Generating...' : 'Export Briefing CSV'}</span>
          </button>
        </div>

        {/* Executive Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-800/60 text-purple-200 text-[11px] font-bold px-3 py-1 rounded-full mb-2 border border-purple-400/30">
                <Building2 className="w-3.5 h-3.5 text-purple-300" />
                <span>Executive Decision Support</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">Strategic Governance & Bottleneck Analysis</h1>
              <p className="text-xs text-purple-200 mt-1 max-w-3xl">
                Aggregated civic intelligence strictly scoped to your administrative jurisdiction. Personal details are
                redacted and small counts (&lt;5) are suppressed under the Digital Personal Data Protection Act.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-purple-800/60 text-xs text-purple-200">
            <span>
              Scope: <strong className="text-white">{scope.scopeDescription}</strong>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-emerald-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Privacy Shield Active</span>
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveView('constituencies')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'constituencies'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cross-Constituency Comparison</span>
          </button>

          <button
            onClick={() => setActiveView('bottlenecks')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'bottlenecks'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Department Bottlenecks</span>
          </button>

          <button
            onClick={() => setActiveView('hotspots')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'hotspots'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Hot-Spot Surging Clusters</span>
          </button>

          <button
            onClick={() => setActiveView('sla')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'sla'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>SLA Escalation Health</span>
          </button>
        </div>

        {/* VIEW 1: Cross-Constituency Comparison Table */}
        {activeView === 'constituencies' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cross-Constituency Performance Breakdown</h2>
              <p className="text-xs text-slate-500">
                Comparative intake, resolution rate, and verified citizen outcomes across constituencies within scope.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Constituency / Ward</th>
                    <th className="py-3 px-3">Level</th>
                    <th className="py-3 px-3 text-right">Intake</th>
                    <th className="py-3 px-3 text-right">Resolved</th>
                    <th className="py-3 px-3 text-right">Overdue</th>
                    <th className="py-3 px-3 text-right">Confirmed Credit</th>
                    <th className="py-3 px-3 text-right">Resolution Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {constituencyBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No constituency data found within assigned scope.
                      </td>
                    </tr>
                  ) : (
                    constituencyBreakdown.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-3 text-slate-500 uppercase text-[10px]">{c.level?.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-3 text-right font-medium">{c.intake}</td>
                        <td className="py-3 px-3 text-right font-semibold text-emerald-700">{c.resolved}</td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600">{c.overdue}</td>
                        <td className="py-3 px-3 text-right font-bold text-blue-700">{c.confirmedCredit}</td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">{c.resolutionRate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: Departmental Bottlenecks */}
        {activeView === 'bottlenecks' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Departmental Bottleneck Analysis</h2>
              <p className="text-xs text-slate-500">
                Identifies departments with high resolution delay, frequent escalations, or citizen disputes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Category / Department</th>
                    <th className="py-3 px-3 text-right">Total Grievances</th>
                    <th className="py-3 px-3 text-right">Avg Resolution Time</th>
                    <th className="py-3 px-3 text-right">Escalations</th>
                    <th className="py-3 px-3 text-right">Citizen Disputes</th>
                    <th className="py-3 px-3 text-right">Dispute Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentalBottlenecks.map((b: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 capitalize">{b.category}</td>
                      <td className="py-3 px-3 text-right font-medium">{b.totalIssues}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">{b.avgResolutionHours}</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">{b.escalationCount}</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">{b.disputeCount}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">{b.disputeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: Hot-Spot Surging Clusters */}
        {activeView === 'hotspots' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Surging Volume & Hot-Spot Clusters</h2>
              <p className="text-xs text-slate-500">
                Highlights categories experiencing a surge (&ge;20% increase) in grievance volume over the last 30 days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotSpotClusters.map((h: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition ${
                    h.isSurging
                      ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black capitalize text-slate-900">{h.category}</span>
                    {h.isSurging && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" />
                        <span>Surging</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                    <span>Recent 30 Days:</span>
                    <strong className="text-slate-900 font-black">{h.currentVolume}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>Prior 30 Days:</span>
                    <strong className="text-slate-600">{h.priorVolume}</strong>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-3 mt-3 border-t border-slate-200/60">
                    <span className="text-slate-500">Trend:</span>
                    <span className={`font-black ${h.isSurging ? 'text-rose-600' : 'text-slate-700'}`}>
                      {h.surgePercent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: SLA Escalation Health */}
        {activeView === 'sla' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">SLA Escalation Ladder Health</h2>
              <p className="text-xs text-slate-500">
                Measures administrative resolution efficiency across hierarchical escalation tiers.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Total Scoped Grievances</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">{slaHealth.totalIssues ?? 0}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Overall intake</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 block">Escalated to L1</span>
                <span className="text-xl font-black text-amber-900 mt-1 block">{slaHealth.escalatedToL1 ?? 0}</span>
                <span className="text-[10px] text-amber-700 mt-0.5 block">{slaHealth.escalatedToL1Rate} breach rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200">
                <span className="text-[11px] font-bold text-orange-800 block">Escalated to L2</span>
                <span className="text-xl font-black text-orange-900 mt-1 block">{slaHealth.escalatedToL2 ?? 0}</span>
                <span className="text-[10px] text-orange-700 mt-0.5 block">{slaHealth.escalatedToL2Rate} breach rate</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 block">Escalated to L3 (HQ)</span>
                <span className="text-xl font-black text-rose-900 mt-1 block">{slaHealth.escalatedToL3 ?? 0}</span>
                <span className="text-[10px] text-rose-700 mt-0.5 block">{slaHealth.escalatedToL3Rate} breach rate</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong>Administrative Governance Policy:</strong> Grievances that breach their initial SLA at field offices
              escalate to L1 (Assistant Commissioner), L2 (Deputy Municipal Commissioner / District Collector), and L3
              (Central HQ). High L2/L3 rates signal systemic departmental capacity bottlenecks.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExecutiveAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExecutiveAnalysisContent />
    </Suspense>
  );
}
