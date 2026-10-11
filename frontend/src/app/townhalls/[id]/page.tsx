'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import {
  Vote,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Building2,
  CheckCircle2,
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
  const { user, token } = useAuth();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Voting states
  const [votedClauses, setVotedClauses] = useState<Record<string, 'up' | 'down'>>({});

  // Feedback form
  const [feedbackType, setFeedbackType] = useState<'support' | 'concern' | 'amendment'>('amendment');
  const [selectedClauseId, setSelectedClauseId] = useState<string>('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Official Response form
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (id) fetchTopicDetail();
  }, [id]);

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
    if (!user) {
      alert('Authentication required to cast vote on legislation clauses');
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
      }
    } catch {
      alert('Failed to record vote');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit deliberation feedback');
      return;
    }
    if (!feedbackContent.trim()) return;

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
            content: feedbackContent,
            clauseId: selectedClauseId || undefined,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setFeedbackContent('');
        fetchTopicDetail();
      } else {
        alert(data.error || 'Failed to submit feedback');
      }
    } catch {
      alert('Network error while posting feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleOfficialResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;

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
          body: JSON.stringify({ responseText }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setResponseText('');
        fetchTopicDetail();
      } else {
        alert(data.message || 'Failed to post official response');
      }
    } catch {
      alert('Network error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        <Vote className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-sm">Loading deliberation...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900">Topic not found</h2>
        <Link href="/townhalls" className="text-blue-600 text-sm font-bold mt-3 inline-block">
          ← Back to Townhalls
        </Link>
      </div>
    );
  }

  const isOfficial = user && (user.role === 'official' || user.role === 'admin');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/townhalls"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'mr' ? 'ग्रामसभा यादीकडे परत' : 'Back to Deliberations'}</span>
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 mb-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            {topic.type.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs font-semibold text-gray-500">
            📍 {topic.villageOrWard} (
            {topic.settlementType === 'rural_panchayat' ? 'Gram Panchayat' : 'Urban Ward'})
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
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'mr'
                  ? 'ग्रामपंचायत / प्रशासकीय विभागाचे अधिकृत उत्तर:'
                  : 'Official Administrative / Gram Panchayat Statement:'}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{topic.officialResponse.text}</p>
            <div className="text-[11px] text-emerald-700 mt-2">
              Recorded on {new Date(topic.officialResponse.respondedAt).toLocaleDateString()}
            </div>
          </div>
        ) : isOfficial ? (
          <form onSubmit={handleOfficialResponse} className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
            <h4 className="text-xs font-bold text-blue-900 mb-1">
              Post Official Department / Gram Panchayat Position
            </h4>
            <textarea
              required
              rows={2}
              placeholder="State the official action taken, budget sanctioned, or committee review timeline..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white mb-2"
            />
            <button
              type="submit"
              disabled={submittingResponse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
            >
              {submittingResponse ? 'Posting...' : 'Publish Official Position'}
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
              {topic.clauses.length} {language === 'mr' ? 'कलमे' : 'clauses'}
            </span>
          </div>

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
                      Clause {idx + 1}: {clause.title}
                    </span>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="text-emerald-700 font-semibold">{clause.voteUp || 0} Agree</span>
                      <span>•</span>
                      <span className="text-rose-700 font-semibold">{clause.voteDown || 0} Disagree</span>
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
                      {totalVotes} {language === 'mr' ? 'नागरिक कौल' : 'citizen votes'} (
                      {supportPercent}% approval)
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
                        <span>{language === 'mr' ? 'मान्य' : 'Agree'}</span>
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
                        <span>{language === 'mr' ? 'अमान्य' : 'Disagree'}</span>
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
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition ${
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
                  ? language === 'mr' ? 'विधायक दुरुस्ती (Amendment)' : 'Amendment'
                  : t === 'concern'
                  ? language === 'mr' ? 'चिंता / आक्षेप (Concern)' : 'Concern'
                  : language === 'mr' ? 'समर्थन (Support)' : 'Support'}
              </button>
            ))}
          </div>

          <textarea
            required
            rows={3}
            placeholder={
              feedbackType === 'amendment'
                ? 'Propose a specific wording change or constructive alternative clause...'
                : 'Share your perspective on public impact...'
            }
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
            className="w-full text-xs p-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 mb-3"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingFeedback}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingFeedback ? 'Posting...' : 'Submit Constructive Input'}</span>
            </button>
          </div>
        </form>

        {/* Feedback Feed */}
        {feedbackList.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">
            No amendments posted yet. Propose the first constructive clause adjustment above.
          </p>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((fb) => (
              <div
                key={fb._id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
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
