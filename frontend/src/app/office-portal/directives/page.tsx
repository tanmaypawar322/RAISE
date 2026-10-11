'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Send,
  FileText,
  ChevronRight,
  Filter,
  Check,
  X,
} from 'lucide-react';

interface DirectiveItem {
  _id: string;
  issueId?: {
    _id: string;
    title: string;
    category: string;
    status: string;
    escalationTier: number;
    location?: { ward?: string; city?: string };
  };
  issuerTitle?: string;
  directiveText: string;
  deadlineHours: number;
  deadlineAt: string;
  targetOfficeId?: {
    _id: string;
    name: string;
    level: string;
  };
  issuerOfficeId?: {
    _id: string;
    name: string;
    level: string;
  };
  status: 'active' | 'complied' | 'breached';
  compliedAt?: string;
  complianceProof?: {
    note?: string;
    photoUrls?: string[];
    verifiedAt?: string;
  };
  createdAt: string;
}

export default function OfficeDirectivesPage() {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();

  const [directives, setDirectives] = useState<DirectiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'complied' | 'breached'>('all');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [complyingDirectiveId, setComplyingDirectiveId] = useState<string | null>(null);

  // Form states
  const [issueId, setIssueId] = useState('');
  const [targetOfficeId, setTargetOfficeId] = useState('');
  const [directiveText, setDirectiveText] = useState('');
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [issuerTitle, setIssuerTitle] = useState('');
  const [complianceNote, setComplianceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const officeId = user?.officialOfficeId;

  useEffect(() => {
    if (officeId && token) {
      fetchDirectives();
    } else {
      setLoading(false);
    }
  }, [officeId, token, statusFilter]);

  const fetchDirectives = async () => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/escalations/directives/office/${officeId}${
        statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      }`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setDirectives(data.directives || []);
      }
    } catch (err) {
      console.error('Failed to load directives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueId || !targetOfficeId || !directiveText) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/escalations/directives`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            issueId,
            targetOfficeId,
            directiveText,
            deadlineHours: Number(deadlineHours),
            issuerTitle: issuerTitle || undefined,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowIssueModal(false);
        setIssueId('');
        setDirectiveText('');
        fetchDirectives();
      } else {
        alert(data.error || 'Failed to issue directive');
      }
    } catch {
      alert('Network error while issuing directive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complyingDirectiveId) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/escalations/directives/${complyingDirectiveId}/comply`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            note: complianceNote || 'Compliance completed and verified by nodal authority.',
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setComplyingDirectiveId(null);
        setComplianceNote('');
        fetchDirectives();
      } else {
        alert(data.error || 'Failed to comply directive');
      }
    } catch {
      alert('Network error while recording compliance');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCountdown = (deadlineAt: string, status: string) => {
    if (status === 'complied') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {language === 'mr' ? 'पूर्तता झाली' : language === 'hi' ? 'अनुपालन पूर्ण' : 'Complied'}
        </span>
      );
    }
    const diff = new Date(deadlineAt).getTime() - Date.now();
    if (diff <= 0 || status === 'breached') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5" />
          {language === 'mr' ? 'मुदत संपली (Breached)' : language === 'hi' ? 'समयसीमा समाप्त (Breached)' : 'Statutory Breach'}
        </span>
      );
    }
    const hoursLeft = Math.ceil(diff / (1000 * 3600));
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        {hoursLeft}h {language === 'mr' ? 'उरले आहेत' : language === 'hi' ? 'शेष हैं' : 'remaining'}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {language === 'mr' ? 'वरिष्ठ प्रशासकीय आदेश' : language === 'hi' ? 'वरिष्ठ प्रशासनिक निर्देश' : 'Supervisory Directives'}
            </span>
            <span className="text-xs text-gray-500">Tier 2–5 Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {language === 'mr' ? 'प्रशासकीय निर्देश व कारवाई कक्ष' : language === 'hi' ? 'प्रशासनिक निर्देश एवं अनुपालन कक्ष' : 'Binding Directives Triage Dashboard'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {language === 'mr'
              ? 'बीडीओ, मुख्य कार्यकारी अधिकारी, जिल्हाधिकारी व मंत्रालयाकडून दिलेल्या कायदेशीर आदेशांची स्थिती व मुदत घड्याळ.'
              : language === 'hi'
              ? 'बीडीओ, मुख्य कार्यकारी अधिकारी, जिलाधिकारी व मंत्रालय द्वारा दिए गए बाध्यकारी निर्देशों की निगरानी।'
              : 'Statutory supervisory countdown clocks issued across Taluka BDO, Zilla Parishad CEO, District Collector, and Ministry tiers.'}
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition"
        >
          <Send className="w-4 h-4" />
          <span>{language === 'mr' ? 'नवीन आदेश द्या' : language === 'hi' ? 'नया निर्देश जारी करें' : 'Issue Directive'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'active', 'breached', 'complied'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
              statusFilter === s
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {s === 'all'
              ? language === 'mr' ? 'सर्व आदेश' : language === 'hi' ? 'सभी निर्देश' : 'All Directives'
              : s === 'active'
              ? language === 'mr' ? 'सक्रिय (Active)' : 'Active'
              : s === 'breached'
              ? language === 'mr' ? 'मुदत संपलेले (Breached)' : 'Breached'
              : language === 'mr' ? 'पूर्ण झालेले (Complied)' : 'Complied'}
          </button>
        ))}
      </div>

      {/* Directives List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm">Loading supervisory directives...</p>
        </div>
      ) : directives.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <ShieldAlert className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">
            {language === 'mr' ? 'कोणतेही निर्देश उपलब्ध नाहीत' : 'No directives found'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {language === 'mr'
              ? 'या कार्यालयाशी संबंधित सध्या कोणतेही सक्रिय किंवा प्रलंबित निर्देश नाहीत.'
              : 'There are currently no active or pending binding supervisory directives for this office.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {directives.map((dir) => (
            <div
              key={dir._id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-blue-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">
                    {dir.issuerTitle || dir.issuerOfficeId?.name || 'Supervisory Authority'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-800">
                    {dir.targetOfficeId?.name || 'Nodal Agency'}
                  </span>
                </div>
                <div>{formatCountdown(dir.deadlineAt, dir.status)}</div>
              </div>

              {dir.issueId && (
                <div className="mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Grievance #{dir.issueId._id.slice(-6)} • Tier {dir.issueId.escalationTier || 1}/5
                    </span>
                    <span className="text-sm font-bold text-gray-900">{dir.issueId.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {dir.issueId.location?.ward || 'Local Ward'}
                  </span>
                </div>
              )}

              <p className="text-sm text-gray-800 font-medium bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 mb-3">
                &ldquo;{dir.directiveText}&rdquo;
              </p>

              {dir.status === 'complied' && dir.complianceProof && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mb-3">
                  <span className="font-bold block mb-0.5">
                    {language === 'mr' ? 'पूर्तता अहवाल:' : 'Compliance Proof:'}
                  </span>
                  <p>{dir.complianceProof.note}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span>
                  {language === 'mr' ? 'जारी केले:' : 'Issued:'}{' '}
                  {new Date(dir.createdAt).toLocaleDateString()}
                </span>
                {dir.status === 'active' && (
                  <button
                    onClick={() => setComplyingDirectiveId(dir._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'mr' ? 'पूर्तता नोंदवा' : language === 'hi' ? 'अनुपालन दर्ज करें' : 'Record Compliance'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Issue Directive */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {language === 'mr' ? 'नवीन कायदेशीर निर्देश द्या' : language === 'hi' ? 'बाध्यकारी निर्देश जारी करें' : 'Issue Binding Directive'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Directives carry statutory compliance deadlines with automatic escalation and audit accountability.
            </p>

            <form onSubmit={handleCreateDirective} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Issue ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 660f..."
                  value={issueId}
                  onChange={(e) => setIssueId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Office ID</label>
                <input
                  type="text"
                  required
                  placeholder="Designated nodal department or Gram Panchayat"
                  value={targetOfficeId}
                  onChange={(e) => setTargetOfficeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'mr' ? 'मुदत (तास)' : 'Statutory Deadline'}
                  </label>
                  <select
                    value={deadlineHours}
                    onChange={(e) => setDeadlineHours(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
                  >
                    <option value={24}>24 Hours (Critical)</option>
                    <option value={48}>48 Hours (Standard)</option>
                    <option value={72}>72 Hours</option>
                    <option value={168}>7 Days (Scheme Work)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'mr' ? 'पद / हुद्दा' : 'Signatory Title'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BDO / Collector"
                    value={issuerTitle}
                    onChange={(e) => setIssuerTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'mr' ? 'निर्देश मजकूर (Directive Instructions)' : 'Directive Instructions'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Clear instructions to the ground field team with specific action required..."
                  value={directiveText}
                  onChange={(e) => setDirectiveText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {submitting ? 'Issuing...' : 'Issue Binding Directive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comply Directive */}
      {complyingDirectiveId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setComplyingDirectiveId(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {language === 'mr' ? 'आदेश पूर्तता नोंदणी' : language === 'hi' ? 'अनुपालन दर्ज करें' : 'Record Directive Compliance'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Submit proof and notes confirming actions taken in accordance with the directive.
            </p>

            <form onSubmit={handleComply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'mr' ? 'पूर्तता टिप्पणी' : 'Compliance Action Note'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Details of physical inspection, repair completed, or administrative orders issued..."
                  value={complianceNote}
                  onChange={(e) => setComplianceNote(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComplyingDirectiveId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Mark as Complied'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
