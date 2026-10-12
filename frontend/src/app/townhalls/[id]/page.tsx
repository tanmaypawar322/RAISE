'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { CivicSealBadge } from '../../../components/CivicSealBadge';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Vote,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Send,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface ClauseItem {
  clauseId: string;
  title: string;
  text: string;
  voteUp: number;
  voteDown: number;
}

interface FeedbackItem {
  _id: string;
  userId?: {
    displayName: string;
    role: string;
  };
  type: 'support' | 'concern' | 'amendment';
  content: string;
  upvotes: number;
  clauseId?: string;
  createdAt: string;
}

interface TopicDetail {
  _id: string;
  title: string;
  type: string;
  settlementType: string;
  villageOrWard: string;
  summary: string;
  clauses: ClauseItem[];
  status: string;
  officialResponse?: {
    text: string;
    respondedAt: string;
    respondedByOfficeId?: { name: string };
  };
  createdAt: string;
}

function TownhallDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const { t, language } = useLanguage();
  const { user, token, openAuthModal } = useAuth();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Voting states
  const [votedClauses, setVotedClauses] = useState<Record<string, 'up' | 'down'>>({});
  const [voteNotice, setVoteNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Feedback form
  const [feedbackType, setFeedbackType] = useState<'support' | 'concern' | 'amendment'>('amendment');
  const [selectedClauseId, setSelectedClauseId] = useState<string>('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Official Response form
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [officialResponseStatus, setOfficialResponseStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    if (id) fetchTopicDetail();
  }, [id]);

  useEffect(() => {
    if (feedbackStatus?.type === 'success') {
      const timer = setTimeout(() => setFeedbackStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackStatus]);

  useEffect(() => {
    if (voteNotice?.type === 'success') {
      const timer = setTimeout(() => setVoteNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [voteNotice]);

  useEffect(() => {
    if (officialResponseStatus?.type === 'success') {
      const timer = setTimeout(() => setOfficialResponseStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [officialResponseStatus]);

  const fetchTopicDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/townhalls/${id}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setTopic(data.topic);
        setFeedbackList(data.feedback || []);
      }
    } catch (err) {
      console.error('Failed to load topic:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClause = async (clauseId: string, vote: 'up' | 'down') => {
    setVoteNotice(null);
    if (!user) {
      setVoteNotice({
        type: 'error',
        message:
          language === 'mr'
            ? 'मतदान करण्यासाठी कृपया साइन इन करा.'
            : language === 'hi'
            ? 'मतदान करने के लिए कृपया साइन इन करें।'
            : 'Authentication required to cast vote on legislation clauses.',
      });
      openAuthModal();
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/townhalls/${id}/clauses/${clauseId}/vote`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vote }),
        }
      );
      const data = await res.json();
      if (data.success && topic) {
        setVotedClauses((prev) => ({ ...prev, [clauseId]: vote }));
        setVoteNotice({
          type: 'success',
          message:
            language === 'mr'
              ? 'तुमचे मत यशस्वीरीत्या नोंदवले गेले!'
              : language === 'hi'
              ? 'आपका मत सफलतापूर्वक दर्ज कर लिया गया!'
              : 'Vote recorded successfully!',
        });
        setTopic({
          ...topic,
          clauses: topic.clauses.map((c) =>
            c.clauseId === clauseId
              ? {
                  ...c,
                  voteUp: vote === 'up' ? c.voteUp + 1 : c.voteUp,
                  voteDown: vote === 'down' ? c.voteDown + 1 : c.voteDown,
                }
              : c
          ),
        });
      } else {
        setVoteNotice({
          type: 'error',
          message: data.message || 'Failed to record vote',
        });
      }
    } catch {
      setVoteNotice({
        type: 'error',
        message: 'Failed to record vote',
      });
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackStatus(null);
    if (!user) {
      setFeedbackStatus({
        type: 'error',
        message:
          language === 'mr'
            ? 'अभिप्राय नोंदवण्यासाठी कृपया साइन इन करा.'
            : language === 'hi'
            ? 'सुझाव दर्ज करने के लिए कृपया साइन इन करें।'
            : 'Please log in to submit deliberation feedback.',
      });
      openAuthModal();
      return;
    }
    const trimmed = feedbackContent.trim();
    if (!trimmed) {
      setFeedbackStatus({
        type: 'error',
        message:
          language === 'mr'
            ? 'कृपया तुमचा अभिप्राय लिहा.'
            : language === 'hi'
            ? 'कृपया अपना सुझाव लिखें।'
            : 'Please enter your feedback text.',
      });
      return;
    }

    if (trimmed.length < 3) {
      setFeedbackStatus({
        type: 'error',
        message:
          language === 'mr'
            ? 'कृपया किमान ३ अक्षरे प्रविष्ट करा.'
            : language === 'hi'
            ? 'कृपया कम से कम ३ अक्षर दर्ज करें।'
            : 'Feedback must contain at least 3 characters.',
      });
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/townhalls/${id}/feedback`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: feedbackType,
            content: trimmed,
            clauseId: selectedClauseId || undefined,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setFeedbackContent('');
        setFeedbackStatus({
          type: 'success',
          message:
            language === 'mr'
              ? 'तुमचा अभिप्राय यशस्वीरीत्या नोंदवला गेला!'
              : language === 'hi'
              ? 'आपका सुझाव सफलतापूर्वक दर्ज किया गया!'
              : 'Your input was posted to the deliberation feed successfully!',
        });
        fetchTopicDetail();
      } else {
        setFeedbackStatus({
          type: 'error',
          message: data.error || data.message || 'Failed to submit feedback',
        });
      }
    } catch {
      setFeedbackStatus({
        type: 'error',
        message: 'Network error while posting feedback. Please check connection.',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleOfficialResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficialResponseStatus(null);
    const trimmed = responseText.trim();
    if (!trimmed) return;

    if (trimmed.length < 10) {
      setOfficialResponseStatus({
        type: 'error',
        message:
          language === 'mr'
            ? 'अधिकृत उत्तर किमान १० अक्षरांचे असावे.'
            : language === 'hi'
            ? 'आधिकारिक उत्तर कम से कम १० अक्षरों का होना चाहिए।'
            : 'Official response must be at least 10 characters.',
      });
      return;
    }

    setSubmittingResponse(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/townhalls/${id}/respond`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ responseText: trimmed }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setResponseText('');
        setOfficialResponseStatus({
          type: 'success',
          message:
            language === 'mr'
              ? 'अधिकृत उत्तर यशस्वीरीत्या प्रसिद्ध केले गेले!'
              : language === 'hi'
              ? 'आधिकारिक उत्तर सफलतापूर्वक प्रकाशित किया गया!'
              : 'Official response published successfully!',
        });
        fetchTopicDetail();
      } else {
        setOfficialResponseStatus({
          type: 'error',
          message: data.message || data.error || 'Failed to post official response',
        });
      }
    } catch {
      setOfficialResponseStatus({
        type: 'error',
        message: 'Network error while publishing response',
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Democratic Deliberation" subtitle="Townhall Dossier">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
          <Vote className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm">Loading deliberation...</p>
        </div>
      </AppShell>
    );
  }

  if (!topic) {
    return (
      <AppShell title="Democratic Deliberation" subtitle="Townhall Dossier">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-gray-900">Topic not found</h2>
          <Link href="/townhalls" className="text-blue-600 text-sm font-bold mt-3 inline-block">
            ← Back to Townhalls
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOfficial = user && (user.role === 'official' || user.role === 'admin');

  return (
    <AppShell title={topic?.title || 'Democratic Deliberation'} subtitle="Civic Townhall & E-Gram Sabha">
      <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/townhalls"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'mr' ? 'ग्रामसभा यादीकडे परत' : language === 'hi' ? 'ग्राम सभा सूची पर वापस' : 'Back to Deliberations'}</span>
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {topic.type.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs font-semibold text-gray-500">
            📍 {topic.villageOrWard} (
            {topic.settlementType === 'rural_panchayat'
              ? language === 'mr' ? 'ग्रामपंचायत' : language === 'hi' ? 'ग्राम पंचायत' : 'Gram Panchayat'
              : language === 'mr' ? 'नागरी प्रभाग' : language === 'hi' ? 'शहरी वार्ड' : 'Urban Ward'}
            )
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
          {topic.title}
        </h1>

        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line mb-6">
          {topic.summary}
        </p>

        {/* Official Response Banner */}
        {topic.officialResponse ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'mr'
                    ? 'ग्रामपंचायत / प्रशासकीय विभागाचे अधिकृत उत्तर:'
                    : language === 'hi'
                    ? 'ग्राम पंचायत / प्रशासनिक विभाग का आधिकारिक उत्तर:'
                    : 'Official Administrative / Gram Panchayat Statement:'}
                </span>
              </div>
              <CivicSealBadge
                tier={topic.settlementType === 'rural_panchayat' ? 'panchayat' : 'executive'}
                officeName={topic.officialResponse.respondedByOfficeId?.name || (topic.settlementType === 'rural_panchayat' ? (language === 'mr' ? 'ग्रामपंचायत' : language === 'hi' ? 'ग्राम पंचायत' : 'Gram Panchayat') : (language === 'mr' ? 'प्रशासकीय कार्यालय' : language === 'hi' ? 'प्रशासनिक कार्यालय' : 'Civic Office'))}
                designation={topic.settlementType === 'rural_panchayat' ? (language === 'mr' ? 'सरपंच / ग्रामसेवक' : language === 'hi' ? 'सरपंच / ग्राम सेवक' : 'Sarpanch / Gram Sevak') : (language === 'mr' ? 'प्रभाग अधिकारी' : language === 'hi' ? 'वार्ड अधिकारी' : 'Ward Officer')}
                size="xs"
              />
            </div>
            <p className="text-sm leading-relaxed">{topic.officialResponse.text}</p>
            <div className="text-[11px] text-emerald-700 mt-2">
              {language === 'mr' ? 'नोंद दिनांक: ' : language === 'hi' ? 'दर्ज दिनांक: ' : 'Recorded on '}
              {new Date(topic.officialResponse.respondedAt).toLocaleDateString()}
            </div>
          </div>
        ) : isOfficial ? (
          <form onSubmit={handleOfficialResponse} className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
            <h4 className="text-xs font-bold text-blue-900 mb-1">
              {language === 'mr'
                ? 'कार्यालयीन / ग्रामपंचायत अधिकृत भूमिका नोंदवा'
                : language === 'hi'
                ? 'कार्यालयीन / ग्राम पंचायत आधिकारिक रुख दर्ज करें'
                : 'Post Official Department / Gram Panchayat Position'}
            </h4>
            {officialResponseStatus && (
              <div
                className={`p-3 rounded-xl mb-3 flex items-start justify-between gap-2 text-xs font-semibold ${
                  officialResponseStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {officialResponseStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{officialResponseStatus.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOfficialResponseStatus(null)}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <textarea
              required
              rows={2}
              placeholder={
                language === 'mr'
                  ? 'कार्यालयीन कार्यवाही, मंजूर केलेला निधी किंवा पुनरावलोकन कालमर्यादा नमूद करा...'
                  : language === 'hi'
                  ? 'कार्यालयीन कार्यवाही, स्वीकृत बजट अथवा समीक्षा समय-सीमा का उल्लेख करें...'
                  : 'State the official action taken, budget sanctioned, or committee review timeline...'
              }
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white mb-2"
            />
            <button
              type="submit"
              disabled={submittingResponse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {submittingResponse
                ? language === 'mr' ? 'नोंदवत आहे...' : language === 'hi' ? 'दर्ज हो रहा है...' : 'Posting...'
                : language === 'mr' ? 'अधिकृत उत्तर प्रसिद्ध करा' : language === 'hi' ? 'आधिकारिक उत्तर प्रकाशित करें' : 'Publish Official Position'}
            </button>
          </form>
        ) : null}
      </div>

      {/* Clause-by-Clause Voting Section */}
      {topic.clauses && topic.clauses.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Vote className="w-5 h-5 text-blue-600" />
              <span>
                {language === 'mr'
                  ? 'कलमवार नागरिक मतदान व कौल'
                  : language === 'hi'
                  ? 'खंडवार नागरिक मतदान एवं अभिमत'
                  : 'Clause-by-Clause Voting'}
              </span>
            </h2>
            <span className="text-xs text-gray-500 font-semibold">
              {topic.clauses.length} {language === 'mr' ? 'कलमे' : language === 'hi' ? 'खंड' : 'clauses'}
            </span>
          </div>

          {voteNotice && (
            <div
              className={`p-3 rounded-2xl mb-4 flex items-center justify-between gap-2 text-xs font-semibold ${
                voteNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {voteNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{voteNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoteNotice(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {topic.clauses.map((clause, idx) => {
              const totalVotes = (clause.voteUp || 0) + (clause.voteDown || 0);
              const supportPercent = totalVotes > 0 ? Math.round((clause.voteUp / totalVotes) * 100) : 50;

              return (
                <div
                  key={clause.clauseId}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      {language === 'mr' ? 'कलम' : language === 'hi' ? 'खंड' : 'Clause'} {idx + 1}: {clause.title}
                    </span>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="text-emerald-700 font-semibold">
                        {clause.voteUp || 0} {language === 'mr' ? 'मान्य' : language === 'hi' ? 'सहमति' : 'Agree'}
                      </span>
                      <span>•</span>
                      <span className="text-rose-700 font-semibold">
                        {clause.voteDown || 0} {language === 'mr' ? 'अमान्य' : language === 'hi' ? 'असहमत' : 'Disagree'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 font-medium mb-4 leading-relaxed">
                    {clause.text}
                  </p>

                  {/* Consensus bar */}
                  <div className="w-full bg-rose-100 rounded-full h-1.5 mb-4 overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-1.5 transition-all duration-300"
                      style={{ width: `${supportPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[11px] text-gray-500">
                      {totalVotes} {language === 'mr' ? 'नागरिक कौल' : language === 'hi' ? 'नागरिक मत' : 'citizen votes'} (
                      {supportPercent}% {language === 'mr' ? 'संमती' : language === 'hi' ? 'स्वीकृति' : 'approval'})
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVoteClause(clause.clauseId, 'up')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          votedClauses[clause.clauseId] === 'up'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{language === 'mr' ? 'मान्य' : language === 'hi' ? 'सहमति' : 'Agree'}</span>
                      </button>

                      <button
                        onClick={() => handleVoteClause(clause.clauseId, 'down')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          votedClauses[clause.clauseId] === 'down'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{language === 'mr' ? 'अमान्य' : language === 'hi' ? 'असहमत' : 'Disagree'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Constructive Amendments & Feedback Section */}
      <section className="mb-10">
        <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <span>
            {language === 'mr'
              ? 'नागरिक सुधारणा व विधायक दुरुस्ती मसुदा'
              : language === 'hi'
              ? 'रचनात्मक संशोधन एवं नागरिक सुझाव'
              : 'Constructive Amendments & Deliberation'}
          </span>
        </h2>

        {/* Feedback Input Form */}
        <form onSubmit={handleSubmitFeedback} className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            {(['amendment', 'concern', 'support'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFeedbackType(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition cursor-pointer ${
                  feedbackType === t
                    ? t === 'amendment'
                      ? 'bg-indigo-600 text-white'
                      : t === 'concern'
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {t === 'amendment'
                  ? language === 'mr' ? 'विधायक दुरुस्ती' : language === 'hi' ? 'रचनात्मक संशोधन' : 'Amendment'
                  : t === 'concern'
                  ? language === 'mr' ? 'चिंता / आक्षेप' : language === 'hi' ? 'चिंता / आपत्ति' : 'Concern'
                  : language === 'mr' ? 'समर्थन' : language === 'hi' ? 'समर्थन' : 'Support'}
              </button>
            ))}
          </div>

          {feedbackStatus && (
            <div
              className={`p-3 rounded-2xl mb-3 flex items-start justify-between gap-2 text-xs font-semibold ${
                feedbackStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackStatus.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackStatus(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <textarea
            required
            rows={3}
            placeholder={
              feedbackType === 'amendment'
                ? language === 'mr'
                  ? 'विशिष्ट शब्दरचना किंवा पर्यायी विधायक कलमाचा मसुदा सुचवा...'
                  : language === 'hi'
                  ? 'विशिष्ट शब्दावली अथवा वैकल्पिक रचनात्मक खंड का प्रारूप प्रस्तावित करें...'
                  : 'Propose a specific wording change or constructive alternative clause...'
                : language === 'mr'
                ? 'या धोरणाचा समाजावर होणारा परिणाम किंवा आपला दृष्टिकोन मांडा...'
                : language === 'hi'
                ? 'इस नीति का जनमानस पर प्रभाव अथवा अपना दृष्टिकोण साझा करें...'
                : 'Share your perspective on public impact...'
            }
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
            className="w-full text-xs p-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 mb-2"
          />

          <div className="flex items-center justify-between mb-3 text-[11px] text-gray-500">
            <span>
              {language === 'mr'
                ? 'किमान ३ अक्षरे आवश्यक'
                : language === 'hi'
                ? 'कम से कम ३ अक्षर आवश्यक'
                : 'Minimum 3 characters required'}
            </span>
            <span
              className={
                feedbackContent.length > 0 && feedbackContent.trim().length < 3
                  ? 'text-amber-600 font-bold'
                  : 'text-gray-400'
              }
            >
              {feedbackContent.length}/1000
            </span>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingFeedback}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {submittingFeedback
                  ? language === 'mr' ? 'नोंदवत आहे...' : language === 'hi' ? 'दर्ज हो रहा है...' : 'Posting...'
                  : language === 'mr' ? 'सुधारणा नोंदवा' : language === 'hi' ? 'सुझाव दर्ज करें' : 'Submit Constructive Input'}
              </span>
            </button>
          </div>
        </form>

        {/* Feedback Feed */}
        {feedbackList.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">
            {language === 'mr'
              ? 'अद्याप कोणत्याही दुरुस्त्या मांडलेल्या नाहीत. पहिली विधायक दुरुस्ती सुचवा.'
              : language === 'hi'
              ? 'अभी तक कोई संशोधन प्रस्तावित नहीं किया गया है। पहला रचनात्मक संशोधन प्रस्तुत करें।'
              : 'No amendments posted yet. Propose the first constructive clause adjustment above.'}
          </p>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((fb) => (
              <div
                key={fb._id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        fb.type === 'amendment'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : fb.type === 'concern'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {fb.type}
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      {fb.userId?.displayName || 'Citizen Contributor'}
                    </span>
                    <CivicSealBadge
                      role={fb.userId?.role || 'citizen'}
                      jurisdiction={topic.villageOrWard}
                      size="xs"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">{fb.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </AppShell>
  );
}

export default function TownhallDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading deliberation...</p>
        </div>
      }
    >
      <TownhallDetailContent />
    </React.Suspense>
  );
}
