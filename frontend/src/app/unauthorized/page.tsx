'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const { user, logout, getRoleRedirectPath } = useAuth();
  const { t } = useLanguage();

  const homePath = user ? getRoleRedirectPath(user.role) : '/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        {/* Brand Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-600 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          403 Forbidden
        </span>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          {t('accessDeniedTitle')}
        </h1>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {reason === 'admin_required'
            ? t('adminOnlyDesc')
            : reason === 'official_required'
            ? t('officialOnlyDesc')
            : t('accessDeniedDesc')}
        </p>

        {user && (
          <div className="bg-gray-50 rounded-2xl p-3.5 mb-6 text-left border border-gray-200/60">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {t('signedInAsLabel') || 'Signed in as'}
            </div>
            <div className="font-bold text-gray-900 text-sm">{user.displayName || user.name}</div>
            <div className="text-xs text-orange-600 font-semibold capitalize">
              Role: {user.role}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={homePath}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-600/20 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t('goToHome')}</span>
          </Link>

          {user && (
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              <span>{t('switchAccount')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
