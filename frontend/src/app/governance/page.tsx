'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';
import {
  UserCheck,
  Building2,
  Scale,
  Search,
  ExternalLink,
  ChevronLeft,
  Filter,
} from 'lucide-react';

export default function GovernanceDirectoryPage() {
  const { language } = useLanguage();

  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'recent'>('alphabetical');

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const query = new URLSearchParams();
        if (roleFilter !== 'all') query.set('role', roleFilter);
        if (search) query.set('search', search);
        query.set('sort', sortBy);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/representatives/directory/governance?${query.toString()}`
        );
        const data = await res.json();
        setLoading(false);
        if (data.success) {
          setRepresentatives(data.representatives || []);
        }
      } catch (err) {
        setLoading(false);
      }
    };
    fetchDirectory();
  }, [search, roleFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {language === 'mr' ? 'मुख्य पानावर परत' : language === 'hi' ? 'मुख्य पृष्ठ पर वापस' : 'Back to Grievances'}
            </span>
          </Link>

          <Link
            href="/methodology"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Platform Methodology</span>
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl shrink-0">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {language === 'mr'
                  ? 'लोकप्रतिनिधी व प्रशासकीय निर्देशिका'
                  : language === 'hi'
                  ? 'जनप्रतिनिधि एवं प्रशासनिक निर्देशिका'
                  : 'Elected Representatives & Governance Directory'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'mr'
                  ? 'कोणतीही राजकीय पक्षाची मांडणी किंवा अपमानाच्या क्रमवारीशिवाय, निवडून आलेल्या लोकप्रतिनिधींची निष्पक्ष सार्वजनिक निर्देशिका.'
                  : language === 'hi'
                  ? 'बिना किसी राजनीतिक पक्षपात अथवा नकारात्मक रैंकिंग के, निर्वाचित जनप्रतिनिधियों की पारदर्शी सार्वजनिक निर्देशिका।'
                  : 'Strictly neutral directory of elected public representatives. No party branding, no paid placement, and no shame leaderboards.'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or constituency..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="mla">MLA (Assembly)</option>
              <option value="mp_lok_sabha">MP (Lok Sabha)</option>
              <option value="ward_councillor">Ward Councillor</option>
              <option value="sarpanch">Sarpanch</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Representatives List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading directory...</p>
          </div>
        ) : representatives.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-xs">
            No representatives found matching the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {representatives.map((rep) => (
              <div
                key={rep._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {rep.role.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {rep.status === 'verified' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Verified ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Not Yet On RAISE
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {rep.displayName}
                  </h3>

                  <p className="text-xs text-slate-500 mt-0.5">
                    {rep.titleText || rep.jurisdiction?.name || 'Constituency'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">
                    {rep.issuesTakenUpCount > 0 ? (
                      <>
                        <strong className="text-slate-900">{rep.issuesTakenUpCount}</strong> issues taken up
                      </>
                    ) : (
                      <span className="text-slate-400">0 issues taken up</span>
                    )}
                  </span>

                  <Link
                    href={`/representatives/${rep._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>View Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
