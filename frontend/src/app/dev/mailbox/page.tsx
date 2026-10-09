'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { Mail, RefreshCw, Trash2, ExternalLink, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';

interface DevMail {
  id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  createdAt: string;
}

export default function DevMailboxPage() {
  const [emails, setEmails] = useState<DevMail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMailbox = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/dev/mailbox`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmails(data.emails || []);
      } else {
        setError(data.message || 'Dev mailbox is not enabled or available.');
      }
    } catch {
      setError('Unable to fetch dev mailbox. Backend may be offline or mailbox disabled.');
    } finally {
      setLoading(false);
    }
  };

  const clearMailbox = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/dev/mailbox/clear`, {
        method: 'POST',
      });
      if (res.ok) {
        setEmails([]);
      }
    } catch {
      alert('Failed to clear mailbox.');
    }
  };

  useEffect(() => {
    fetchMailbox();
  }, []);

  const extractResetLink = (text: string) => {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6 flex items-start justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Dev Mailbox (Non-Production Testing)</strong>
              This simulated mailbox intercepts emails sent by the local development server (password reset links, notifications). Real emails are not dispatched.
            </div>
          </div>
          <Link
            href="/"
            className="font-bold text-amber-800 hover:underline shrink-0 flex items-center gap-1 text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-600" />
            <h1 className="text-lg font-black text-gray-900 tracking-tight">
              Test Inbox ({emails.length})
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMailbox}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={clearMailbox}
              disabled={emails.length === 0}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl mb-4">
            {error}
          </div>
        )}

        {emails.length === 0 && !loading && !error && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">No emails captured yet</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Trigger a password reset or invitation from the platform to inspect captured emails here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {emails.map((msg) => {
            const resetLink = extractResetLink(msg.text);
            return (
              <div
                key={msg.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:border-orange-200 transition"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      To: {msg.to}
                    </span>
                    <h2 className="text-sm font-bold text-gray-900 mt-1">
                      {msg.subject}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap font-mono my-3 border border-gray-100">
                  {msg.text}
                </div>

                {resetLink && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Action Link Detected:</span>
                    <a
                      href={resetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
