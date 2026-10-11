'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Building2,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';

export type AffiliationTier = 'constitutional' | 'executive' | 'resident' | 'panchayat';

export interface CivicSealBadgeProps {
  tier?: AffiliationTier;
  role?: string;
  officeName?: string;
  designation?: string;
  jurisdiction?: string;
  verificationId?: string;
  isVerified?: boolean;
  size?: 'xs' | 'sm' | 'md';
  interactive?: boolean;
  className?: string;
}

/**
 * CivicSealBadge renders an authentic Indian Civic Seal & Ribbon accreditation badge.
 * Designed with municipal & constitutional dignity — distinctly avoiding social media ticks.
 */
export function CivicSealBadge({
  tier,
  role,
  officeName,
  designation,
  jurisdiction,
  verificationId,
  isVerified = true,
  size = 'sm',
  interactive = true,
  className = '',
}: CivicSealBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-detect tier if not explicitly passed
  const effectiveTier: AffiliationTier = React.useMemo(() => {
    if (tier) return tier;
    const r = (role || '').toLowerCase();
    if (
      ['mla', 'mlc', 'mp', 'mp_lok_sabha', 'mp_rajya_sabha', 'councillor', 'ward_councillor', 'minister'].includes(r)
    ) {
      return 'constitutional';
    }
    if (
      ['official', 'officer', 'department_head', 'secretary', 'commissioner', 'engineer', 'cmo', 'admin'].includes(r) ||
      officeName
    ) {
      return 'executive';
    }
    if (['sarpanch', 'gram_sevak', 'panchayat'].includes(r)) {
      return 'panchayat';
    }
    return 'resident';
  }, [tier, role, officeName]);

  // Derived labels
  const roleTitle = React.useMemo(() => {
    if (designation) return designation;
    if (!role) return 'Official';
    const r = role.toLowerCase();
    if (r === 'mla') return 'MLA (Member of Legislative Assembly)';
    if (r === 'mp' || r === 'mp_lok_sabha') return 'MP (Lok Sabha)';
    if (r === 'councillor' || r === 'ward_councillor') return 'Municipal Councillor';
    if (r === 'secretary') return 'Principal Secretary';
    if (r === 'commissioner') return 'Municipal Commissioner';
    if (r === 'engineer') return 'Executive Engineer';
    if (r === 'sarpanch') return 'Village Sarpanch';
    return role.replace(/_/g, ' ').toUpperCase();
  }, [designation, role]);

  const displayOffice = officeName || (effectiveTier === 'constitutional' ? 'Legislative Assembly' : 'Civic Administration');

  // Sizing styles
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  // Tier-specific styles (Dignified Civic Seal & Ribbon, NO generic ticks)
  let containerStyle = '';
  let iconElement = null;
  let tierLabel = '';

  if (effectiveTier === 'constitutional') {
    tierLabel = 'Constitutional / Elected Seat';
    containerStyle =
      'bg-amber-50 text-amber-950 border border-amber-300/80 shadow-xs dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-700/60 ring-1 ring-amber-400/20';
    iconElement = <Landmark className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />;
  } else if (effectiveTier === 'executive') {
    tierLabel = 'Executive Civic Office';
    containerStyle =
      'bg-slate-900 text-white border border-slate-800 shadow-xs dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700';
    iconElement = <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  } else if (effectiveTier === 'panchayat') {
    tierLabel = 'Panchayati Raj Institution';
    containerStyle =
      'bg-emerald-50 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-700/60';
    iconElement = <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />;
  } else {
    tierLabel = 'Verified Resident Citizen';
    containerStyle =
      'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    iconElement = <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />;
  }

  const badgeContent = (
    <div
      className={`inline-flex items-center font-semibold rounded-lg transition select-none ${sizeClasses} ${containerStyle} ${
        interactive ? 'cursor-pointer hover:opacity-95' : ''
      } ${className}`}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={interactive ? 'Click to inspect official civic accreditation' : undefined}
    >
      {/* Civic Emblem Crest Icon */}
      {iconElement}

      {/* Primary Designation & Office Label */}
      <span className="truncate max-w-[220px]">
        {effectiveTier === 'resident'
          ? jurisdiction || 'Verified Resident Voter'
          : `${displayOffice}${designation || role ? ` • ${roleTitle}` : ''}`}
      </span>

      {/* Micro Ribbon Pip */}
      {isVerified && (
        <span
          className={`inline-flex items-center justify-center font-bold px-1 rounded text-[9px] uppercase tracking-wider ${
            effectiveTier === 'constitutional'
              ? 'bg-amber-200/90 text-amber-900 border border-amber-400/50 dark:bg-amber-900/60 dark:text-amber-200'
              : effectiveTier === 'executive'
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          SEAL
        </span>
      )}

      {interactive && (
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      )}
    </div>
  );

  if (!interactive) {
    return badgeContent;
  }

  return (
    <div className="relative inline-block text-left">
      {badgeContent}

      {/* Official Civic Seal Accreditation Dossier Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Seal Crest Banner */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                    effectiveTier === 'constitutional'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : effectiveTier === 'executive'
                      ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-sky-400'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  }`}
                >
                  {effectiveTier === 'constitutional' ? (
                    <Landmark className="w-5 h-5" />
                  ) : effectiveTier === 'executive' ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {tierLabel}
                  </h4>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                    {displayOffice}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Verified
              </span>
            </div>

            {/* Credential Details Matrix */}
            <div className="py-3 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Official Role / Seat:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{roleTitle}</span>
              </div>

              {jurisdiction && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Jurisdiction:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{jurisdiction}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Accreditation ID:</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {verificationId || `SEAL-${(displayOffice + (role || '')).slice(0, 8).toUpperCase()}-VERIFIED`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Statutory SLA Mandate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {effectiveTier === 'constitutional' ? '72-Hour Legislative Clock' : '48-Hour Municipal Resolution'}
                </span>
              </div>
            </div>

            {/* Tri-Ribbon Municipal Accent Strip */}
            <div className="h-1 w-full rounded-full bg-gradient-to-r from-amber-500 via-slate-200 to-emerald-600 mb-2.5 opacity-80" />

            {/* Footer Notice */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Indian Civic Trust Framework
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
