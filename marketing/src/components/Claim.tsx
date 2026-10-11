import React from 'react';
import { claims, Language } from '../../content/claims';

interface ClaimProps {
  id: string;
  lang?: Language;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Claim Component
 *
 * Renders the registered text for a claim ONLY if `claims[id].verified === true`.
 * If unverified, renders the `fallback` node (or null) to ensure zero unverified
 * claims are exposed to visitors.
 */
export function Claim({ id, lang = 'en', fallback = null, className }: ClaimProps) {
  const claim = claims[id];

  if (!claim) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Claim] Unknown claim ID referenced: "${id}"`);
    }
    return <>{fallback}</>;
  }

  if (claim.verified) {
    const localized = claim.text[lang] || claim.text.en;
    return <span className={className}>{localized}</span>;
  }

  // Not verified: render neutral fallback or empty
  return <>{fallback}</>;
}
