'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { AppShell } from '../../components/AppShell';
import {
  Users2,
  FileText,
  Vote,
  MessageSquare,
  Building2,
  CheckCircle2,
  Plus,
  Filter,
  Sparkles,
  ChevronRight,
  Landmark,
} from 'lucide-react';

interface TopicItem {
  _id: string;
  title: string;
  type: 'government_policy' | 'ward_budget' | 'gram_sabha_agenda' | 'community_topic';
  authorType: 'official' | 'representative' | 'citizen';
  settlementType: 'rural_panchayat' | 'urban_municipal';
  villageOrWard: string;
  summary: string;
  clauses?: Array<{ clauseId: string; title: string; text: string; voteUp: number; voteDown: number }>;
  status: 'active' | 'closed' | 'archived';
  officialResponse?: {
    text: string;
    respondedAt: string;
  };
  createdAt: string;
}

export default function TownhallsFeedPage() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [settlementFilter, setSettlementFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('gram_sabha_agenda');
  const [settlementType, setSettlementType] = useState<'rural_panchayat' | 'urban_municipal'>('rural_panchayat');
  const [villageOrWard, setVillageOrWard] = useState('');
  const [summary, setSummary] = useState('');
  const [clausesText, setClausesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [typeFilter, settlementFilter]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (settlementFilter !== 'all') params.append('settlementType', settlementFilter);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/townhalls?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setTopics(data.topics || []);
      }
    } catch (err) {
      console.error('Failed to load townhalls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !villageOrWard) return;

    setSubmitting(true);
    try {
      const clauses = clausesText
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .map((l, idx) => ({
          title: `Clause ${idx + 1}`,
          text: l.trim(),
        }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/townhalls`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            type,
            settlementType,
            villageOrWard,
            summary,
            clauses,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setTitle('');
        setSummary('');
        setVillageOrWard('');
        setClausesText('');
        fetchTopics();
      } else {
        alert(data.error || 'Failed to publish townhall topic');
      }
    } catch {
      alert('Network error while publishing topic');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (tType: string) => {
    switch (tType) {
      case 'gram_sabha_agenda':
        return language === 'mr' ? 'ग्रामसभा विषयपत्रिका' : language === 'hi' ? 'ग्राम सभा कार्यसूची' : 'Gram Sabha Agenda';
      case 'ward_budget':
        return language === 'mr' ? 'प्रभाग अंदाजपत्रक' : language === 'hi' ? 'वार्ड बजट विमर्श' : 'Ward Budget';
      case 'government_policy':
        return language === 'mr' ? 'शासकीय धोरण मसुदा' : language === 'hi' ? 'सरकारी नीति प्रारूप' : 'Policy Draft';
      default:
        return language === 'mr' ? 'नागरिक लोकचर्चा' : language === 'hi' ? 'नागरिक लोकचर्चा' : 'Community Topic';
    }
  };

  return (
    <AppShell
      title={language === 'mr' ? 'डिजिटल ग्रामसभा व लोकशाही विमर्श कक्ष' : language === 'hi' ? 'डिजिटल ग्राम सभा एवं नागरिक नीति विमर्श' : 'Digital Gram Sabha & Civic Townhalls'}
      subtitle={language === 'mr' ? 'गावाच्या व प्रभागाच्या धोरणांवर नागरिकांची थेट चर्चा' : language === 'hi' ? 'गाँव और वार्ड की नीतियों पर नागरिकों का सीधा विचार-विमर्श' : 'Direct citizen deliberation on local budgets, resolutions & public schemes'}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold mb-3 border border-blue-400/30">
              <Landmark className="w-3.5 h-3.5" />
              <span>
                {language === 'mr'
                  ? 'डिजिटल ग्रामसभा व लोकशाही विमर्श कक्ष'
                  : language === 'hi'
                  ? 'डिजिटल ग्राम सभा एवं नागरिक नीति विमर्श'
                  : 'Digital Gram Sabha & Civic Townhalls'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {language === 'mr'
                ? 'गावाच्या व प्रभागाच्या धोरणांवर नागरिकांची थेट चर्चा'
                : language === 'hi'
                ? 'गाँव और वार्ड की नीतियों पर नागरिकों का सीधा विचार-विमर्श'
                : 'Direct Citizen Deliberation on Local Budgets & Schemes'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2">
              {language === 'mr'
                ? 'ग्रामपंचायतीचे ठराव, प्रभागाचे विकास अंदाजपत्रक आणि शासकीय योजनांवर कलमवार मतदान करा आणि विधायक दुरुस्त्या सुचवा.'
                : language === 'hi'
                ? 'ग्राम पंचायत प्रस्तावों, वार्ड बजट और सरकारी योजनाओं पर खंडवार मतदान करें और रचनात्मक संशोधन प्रस्तावित करें।'
                : 'Vote clause-by-clause on Gram Panchayat agendas, ward budgets, and public policies. Suggest constructive amendments.'}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-sm font-bold shadow-lg transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>
              {language === 'mr' ? 'नवीन विषय मांडा' : language === 'hi' ? 'नया विषय प्रस्तुत करें' : 'Propose Topic'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
          {[
            { id: 'all', labelEn: 'All Topics', labelMr: 'सर्व विषय', labelHi: 'सभी विषय' },
            { id: 'gram_sabha_agenda', labelEn: 'Gram Sabha', labelMr: 'ग्रामसभा', labelHi: 'ग्राम सभा' },
            { id: 'ward_budget', labelEn: 'Ward Budget', labelMr: 'प्रभाग बजेट', labelHi: 'वार्ड बजट' },
            { id: 'government_policy', labelEn: 'Govt Policies', labelMr: 'शासकीय धोरणे', labelHi: 'सरकारी नीतियां' },
            { id: 'community_topic', labelEn: 'Community Topics', labelMr: 'नागरिक चर्चा', labelHi: 'सामुदायिक विषय' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                typeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {language === 'mr' ? tab.labelMr : language === 'hi' ? tab.labelHi : tab.labelEn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold text-gray-600">
          <span>{language === 'mr' ? 'भाग:' : language === 'hi' ? 'क्षेत्र:' : 'Region:'}</span>
          <select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium"
          >
            <option value="all">
              {language === 'mr' ? 'अखिल भारत (सर्व)' : language === 'hi' ? 'अखिल भारत (सभी)' : 'All India (Rural & Urban)'}
            </option>
            <option value="rural_panchayat">
              {language === 'mr' ? 'ग्रामपंचायत (ग्रामीण)' : language === 'hi' ? 'ग्राम पंचायत (ग्रामीण)' : 'Gram Panchayat (Rural)'}
            </option>
            <option value="urban_municipal">
              {language === 'mr' ? 'नागरी प्रभाग (म.न.पा.)' : language === 'hi' ? 'शहरी वार्ड (नगर पालिका)' : 'Urban Ward (Municipal)'}
            </option>
          </select>
        </div>
      </div>

      {/* Topics Feed */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
          <Vote className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm">
            {language === 'mr' ? 'चर्चा व अजेंडा लोड होत आहेत...' : language === 'hi' ? 'विमर्श एवं कार्यसूची लोड हो रहे हैं...' : 'Loading deliberations...'}
          </p>
        </div>
      ) : topics.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-gray-200">
          <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">
            {language === 'mr' ? 'कोणतीही चर्चा उपलब्ध नाही' : language === 'hi' ? 'इस श्रेणी में कोई विमर्श सक्रिय नहीं है' : 'No deliberations active in this category'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {language === 'mr'
              ? 'आपल्या गावासाठी किंवा प्रभागासाठी पहिली डिजिटल ग्रामसभा किंवा लोकचर्चा सुरू करा.'
              : language === 'hi'
              ? 'अपने गाँव या वार्ड के लिए पहली डिजिटल ग्राम सभा अथवा नागरिक नीति विमर्श शुरू करें।'
              : 'Be the first to publish a Gram Sabha agenda or civic deliberation topic for your region.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {topics.map((tItem) => (
            <article
              key={tItem._id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {getTypeLabel(tItem.type)}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    📍 {tItem.villageOrWard} (
                    {tItem.settlementType === 'rural_panchayat'
                      ? language === 'mr' ? 'ग्रामपंचायत' : language === 'hi' ? 'ग्राम पंचायत' : 'Gram Panchayat'
                      : language === 'mr' ? 'प्रभाग' : language === 'hi' ? 'वार्ड' : 'Ward'}
                    )
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 hover:text-blue-600 transition">
                  <Link href={`/townhalls/${tItem._id}`}>{tItem.title}</Link>
                </h3>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                  {tItem.summary}
                </p>

                {tItem.clauses && tItem.clauses.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      📜 {tItem.clauses.length}{' '}
                      {language === 'mr' ? 'कलमे मतदानासाठी उपलब्ध' : language === 'hi' ? 'खंड मत हेतु उपलब्ध' : 'Clauses open for voting'}
                    </span>
                    <span className="text-slate-500">
                      {tItem.clauses.reduce((acc, c) => acc + (c.voteUp || 0) + (c.voteDown || 0), 0)}{' '}
                      {language === 'mr' ? 'नागरिक मते' : language === 'hi' ? 'नागरिक मत' : 'citizen votes'}
                    </span>
                  </div>
                )}

                {tItem.officialResponse && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 mb-4 flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      {language === 'mr'
                        ? 'शासनाकडून अधिकृत उत्तर प्राप्त ✓'
                        : language === 'hi'
                        ? 'शासन/पंचायत से आधिकारिक उत्तर दर्ज ✓'
                        : 'Official Government / Panchayat Response Recorded ✓'}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(tItem.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/townhalls/${tItem._id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  <span>
                    {language === 'mr' ? 'चर्चेत सहभागी व्हा' : language === 'hi' ? 'विमर्श में भाग लें' : 'Participate & Vote'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal: Propose Topic */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {language === 'mr' ? 'नवीन डिजिटल ग्रामसभा / लोकचर्चा सुरू करा' : language === 'hi' ? 'नई डिजिटल ग्राम सभा / नीति विमर्श शुरू करें' : 'Propose Townhall Deliberation Topic'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              {language === 'mr'
                ? 'गावातील किंवा प्रभागातील विकासाच्या मुद्द्यांवर सामूहिक मतदान, अंदाजपत्रक व धोरणांचा मसुदा मांडा.'
                : language === 'hi'
                ? 'गाँव अथवा वार्ड के विकास मुद्दों पर सामूहिक मतदान, बजट और नीतियों का प्रारूप प्रस्तुत करें।'
                : 'Draft topics for collective citizen voting, ward budget priorities, or Gram Sabha agendas.'}
            </p>

            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'mr' ? 'विषय शीर्षक' : language === 'hi' ? 'विषय शीर्षक' : 'Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    language === 'mr'
                      ? 'उदा. पाणी साठवण विहीर प्रस्ताव / प्रभाग १२ स्वच्छता कृती आराखडा'
                      : language === 'hi'
                      ? 'उदा. पेयजल टंकी प्रस्ताव / वार्ड १२ स्वच्छता कार्य योजना'
                      : 'e.g. Village Drinking Water Tank Proposal / Ward 12 Sanitation Plan'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'mr' ? 'विषयाचा प्रकार' : language === 'hi' ? 'विषय का प्रकार' : 'Topic Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
                  >
                    <option value="gram_sabha_agenda">
                      {language === 'mr' ? 'ग्रामसभा विषयपत्रिका' : language === 'hi' ? 'ग्राम सभा कार्यसूची' : 'Gram Sabha Agenda'}
                    </option>
                    <option value="ward_budget">
                      {language === 'mr' ? 'प्रभाग अंदाजपत्रक' : language === 'hi' ? 'वार्ड बजट' : 'Ward Budget'}
                    </option>
                    <option value="government_policy">
                      {language === 'mr' ? 'शासकीय धोरण मसुदा' : language === 'hi' ? 'सरकारी नीति प्रारूप' : 'Government Policy'}
                    </option>
                    <option value="community_topic">
                      {language === 'mr' ? 'नागरिक लोकचर्चा' : language === 'hi' ? 'नागरिक लोकचर्चा' : 'Community Topic'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'mr' ? 'प्रशासकीय स्तर' : language === 'hi' ? 'प्रशासनिक स्तर' : 'Settlement Track'}
                  </label>
                  <select
                    value={settlementType}
                    onChange={(e) => setSettlementType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300"
                  >
                    <option value="rural_panchayat">
                      {language === 'mr' ? 'ग्रामपंचायत (ग्रामीण)' : language === 'hi' ? 'ग्राम पंचायत (ग्रामीण)' : 'Gram Panchayat (Rural)'}
                    </option>
                    <option value="urban_municipal">
                      {language === 'mr' ? 'नागरी प्रभाग (म.न.पा.)' : language === 'hi' ? 'शहरी वार्ड (नगर पालिका)' : 'Urban Ward (Municipal)'}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'mr' ? 'गाव / वाडी किंवा प्रभाग' : language === 'hi' ? 'गाँव / ग्राम पंचायत अथवा वार्ड' : 'Village / Gram Panchayat / Ward Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    language === 'mr'
                      ? 'उदा. निगडी / पिंपरी गाव / मौजे शेळपिंपळगाव'
                      : language === 'hi'
                      ? 'उदा. निगडी / पिंपरी गाँव / मौजे शेलपिंपलगाँव'
                      : 'e.g. Nigdi / Pimprigaon / Mauje Shelpimpalgaon'
                  }
                  value={villageOrWard}
                  onChange={(e) => setVillageOrWard(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'mr' ? 'पार्श्वभूमी व सविस्तर सारांश' : language === 'hi' ? 'पृष्ठभूमि एवं विस्तृत सारांश' : 'Summary & Background'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    language === 'mr'
                      ? 'समस्येचा संदर्भ, नागरिकांना होणारा त्रास आणि या विमर्शचा हेतू...'
                      : language === 'hi'
                      ? 'समस्या का संदर्भ, नागरिकों पर प्रभाव और इस विमर्श का उद्देश्य...'
                      : 'Context, problem statement, and purpose of this deliberation...'
                  }
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'mr' ? 'कलमे (प्रत्येक ओळीवर एक कलम)' : language === 'hi' ? 'खंड (प्रत्येक पंक्ति पर एक खंड)' : 'Clauses (One per line for clause-by-clause voting)'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    language === 'mr'
                      ? 'कलम १: सौर ऊर्जेवर चालणारा २४ तास पाणी पंप बसवणे\nकलम २: समितीद्वारे जलवाहिनी देखभाल व ऑडिट\nकलम ३: मासिक ग्रामसभा पाणी उपकर अहवाल'
                      : language === 'hi'
                      ? 'खंड १: सौर ऊर्जा चालित २४ घंटे पानी पंप स्थापना\nखंड २: समिति द्वारा पाइपलाइन रखरखाव ऑडिट\nखंड ३: मासिक ग्राम सभा जल उपकर रिपोर्ट'
                      : 'Clause 1: 24x7 solar water pump installation\nClause 2: Pipeline maintenance audit by committee\nClause 3: Monthly Gram Sabha water cess report'
                  }
                  value={clausesText}
                  onChange={(e) => setClausesText(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  {language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {submitting
                    ? language === 'mr' ? 'प्रसिद्ध करत आहे...' : language === 'hi' ? 'प्रकाशित हो रहा है...' : 'Publishing...'
                    : language === 'mr' ? 'विमर्श प्रसिद्ध करा' : language === 'hi' ? 'विमर्श प्रकाशित करें' : 'Publish Deliberation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
