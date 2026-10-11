/**
 * Helper to construct URLs pointing to the gated RAISE web application (frontend/)
 *
 * NON-NEGOTIABLE RULE:
 * If NEXT_PUBLIC_APP_URL is missing, this helper raises a build/runtime failure
 * so that dead or unconfigured links never enter production.
 */

export type AppLang = 'en' | 'mr' | 'hi';

export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_APP_URL environment variable is required but is missing or empty.'
      );
    }
    return 'http://localhost:3000';
  }
  return url.replace(/\/+$/, '');
}

/**
 * Builds a validated URL to an app route, preserving the selected language.
 *
 * @param path App route starting with '/' (e.g. '/sign-in', '/sign-up', '/office/request-access')
 * @param lang Active language locale ('en' | 'mr' | 'hi')
 */
export function appUrl(path: string, lang?: AppLang): string {
  const base = getAppBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!lang) {
    return `${base}${cleanPath}`;
  }

  const separator = cleanPath.includes('?') ? '&' : '?';
  return `${base}${cleanPath}${separator}lang=${encodeURIComponent(lang)}`;
}
