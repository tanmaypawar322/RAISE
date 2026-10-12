import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

interface AuthMeResponse {
  success: boolean;
  user?: {
    userId?: string;
    id?: string;
    role: 'citizen' | 'official' | 'agency' | 'moderator' | 'admin';
    displayName: string;
    email?: string;
    status?: 'active' | 'pending' | 'suspended';
    officialOfficeId?: string;
  };
  message?: string;
}

function verifyJwtLocally(token: string, secret?: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    if (secret) {
      const data = `${parts[0]}.${parts[1]}`;
      const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
      if (expectedSig !== parts[2]) {
        return null;
      }
    }

    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    const decoded = JSON.parse(payload);
    if (!decoded || !decoded.exp || decoded.exp * 1000 <= Date.now()) {
      return { expired: true };
    }

    return {
      expired: false,
      user: {
        userId: decoded.userId || decoded.id,
        role: (decoded.role || 'citizen') as 'citizen' | 'official' | 'agency' | 'moderator' | 'admin',
        displayName: decoded.displayName || 'User',
        email: decoded.email,
        status: (decoded.status || 'active') as 'active' | 'pending' | 'suspended',
        officialOfficeId: decoded.officialOfficeId,
      },
    };
  } catch {
    return null;
  }
}

// Routes exempted from authentication gate
const AUTH_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/office/sign-in',
  '/office/request-access',
  '/office/request-status',
];

const PUBLIC_STATIC_ROUTES = [
  '/',
  '/terms',
  '/privacy',
  '/community-guidelines',
  '/guidelines',
  '/how-it-works',
  '/grievance-officer',
  '/grievance-redressal',
  '/transparency',
  '/unauthorized',
  '/pricing',
  '/support',
  '/governance',
  '/methodology',
  '/townhalls',
  '/representatives',
  '/offices',
  '/reports',
];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isPublicStaticRoute(pathname: string): boolean {
  return PUBLIC_STATIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isIssueDetailRoute(pathname: string): boolean {
  // Matches /issues/:id or /issues/:id/:slug
  return /^\/issues\/[^/]+(?:\/[^/]+)?$/.test(pathname);
}

function getSafeRelativePath(pathname: string, search: string): string {
  const full = `${pathname}${search}`;
  if (
    full.startsWith('/') &&
    !full.startsWith('//') &&
    !full.startsWith('/\\') &&
    !full.includes('://') &&
    !full.includes('\\')
  ) {
    return encodeURIComponent(full);
  }
  return encodeURIComponent('/');
}

function getRoleHome(role?: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'official' || role === 'agency') return '/office-portal';
  return '/';
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const appRequireLogin =
    process.env.APP_REQUIRE_LOGIN !== 'false' &&
    process.env.NEXT_PUBLIC_APP_REQUIRE_LOGIN !== 'false';

  const publicIssuePages =
    process.env.PUBLIC_ISSUE_PAGES === 'true' ||
    process.env.NEXT_PUBLIC_PUBLIC_ISSUE_PAGES === 'true';

  // Extract access token cookie
  const rawCookie = request.cookies.get('raise_token')?.value || request.cookies.get('accessToken')?.value;
  let token: string | undefined = undefined;
  if (rawCookie) {
    try {
      token = decodeURIComponent(rawCookie);
    } catch {
      token = rawCookie;
    }
  }

  let validatedUser: AuthMeResponse['user'] | null = null;
  let isTokenStale = false;

  let refreshedToken: string | null = null;

  if (token) {
    const secret = process.env.JWT_SECRET || 'raise_super_secret_jwt_key_2026_dev_mode';
    const local = verifyJwtLocally(token, secret);

    if (local?.expired) {
      // Token expired, attempt silent background rotation with backend
      const apiUrl =
        process.env.INTERNAL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:5000/api';

      try {
        const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(2000),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.token && refreshData.user) {
            refreshedToken = refreshData.token;
            validatedUser = {
              userId: refreshData.user.userId || (refreshData.user as any).id || '',
              role: refreshData.user.role || 'citizen',
              displayName: refreshData.user.displayName || 'User',
              email: refreshData.user.email,
              status: refreshData.user.status || 'active',
              officialOfficeId: refreshData.user.officialOfficeId,
            };
            isTokenStale = false;
          } else {
            isTokenStale = true;
          }
        } else {
          isTokenStale = true;
        }
      } catch {
        isTokenStale = true;
      }
    } else if (local?.user) {
      validatedUser = local.user;

      // Optional backend sync to verify against immediate database revocation
      const apiUrl =
        process.env.INTERNAL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:5000/api';

      try {
        const verifyRes = await fetch(`${apiUrl}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(2000),
        });

        if (verifyRes.ok) {
          const data: AuthMeResponse = await verifyRes.json();
          if (data.success && data.user) {
            validatedUser = {
              userId: data.user.userId || (data.user as any).id || local.user.userId,
              role: data.user.role || local.user.role,
              displayName: data.user.displayName || local.user.displayName,
              email: data.user.email || local.user.email,
              status: data.user.status || local.user.status,
              officialOfficeId: data.user.officialOfficeId || local.user.officialOfficeId,
            };
          }
        } else if (verifyRes.status === 401) {
          const errData = await verifyRes.json().catch(() => ({}));
          // Only invalidate session if backend explicitly revoked session or suspended user
          if (
            errData?.message?.includes('revoked') ||
            errData?.message?.includes('suspended') ||
            errData?.message?.includes('deleted')
          ) {
            validatedUser = null;
            isTokenStale = true;
          }
        }
      } catch {
        // Backend timeout or temporary restart: retain cryptographically valid token
      }
    } else {
      isTokenStale = true;
    }
  }

  // 1. Authenticated User Handling
  if (validatedUser) {
    // If a signed-in user opens an auth page, redirect to their home
    if (isAuthRoute(pathname)) {
      const homePath = getRoleHome(validatedUser.role);
      const res = NextResponse.redirect(new URL(homePath, request.url));
      if (refreshedToken) {
        res.cookies.set('raise_token', refreshedToken, { path: '/', maxAge: 2592000, sameSite: 'lax' });
        res.cookies.set('accessToken', refreshedToken, { path: '/', maxAge: 2592000, sameSite: 'lax' });
      }
      if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return res;
    }

    // Role-based route authorization
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      if (validatedUser.role !== 'admin') {
        const res = NextResponse.redirect(new URL('/unauthorized?reason=admin_required', request.url));
        if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
      }
    }

    if (pathname === '/office-portal' || pathname.startsWith('/office-portal/')) {
      if (
        validatedUser.role !== 'official' &&
        validatedUser.role !== 'agency' &&
        validatedUser.role !== 'admin'
      ) {
        const res = NextResponse.redirect(new URL('/unauthorized?reason=official_required', request.url));
        if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
      }
    }

    const res = NextResponse.next();
    if (refreshedToken) {
      res.cookies.set('raise_token', refreshedToken, { path: '/', maxAge: 2592000, sameSite: 'lax' });
      res.cookies.set('accessToken', refreshedToken, { path: '/', maxAge: 2592000, sameSite: 'lax' });
    }
    if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // 2. Unauthenticated Visitor Handling
  // Allow Auth routes through
  if (isAuthRoute(pathname)) {
    const res = NextResponse.next();
    if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // Allow Public Static & Legal routes through
  if (isPublicStaticRoute(pathname)) {
    const res = NextResponse.next();
    if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // Allow Issue details if PUBLIC_ISSUE_PAGES=true
  if (publicIssuePages && isIssueDetailRoute(pathname)) {
    const res = NextResponse.next();
    if (appRequireLogin) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // If app requires login, gate all other routes!
  if (appRequireLogin) {
    const safeNext = getSafeRelativePath(pathname, search);
    const isOfficeRoute = pathname.startsWith('/office-portal');
    const authTarget = isOfficeRoute ? '/office/sign-in' : '/sign-in';

    const redirectUrl = isTokenStale
      ? new URL(`${authTarget}?next=${safeNext}&expired=1`, request.url)
      : new URL(`${authTarget}?next=${safeNext}`, request.url);

    const res = NextResponse.redirect(redirectUrl);
    if (isTokenStale) {
      res.cookies.delete('raise_token');
      res.cookies.delete('accessToken');
    }
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // If appRequireLogin is false, allow public browsing
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon.ico, sitemap.xml, robots.txt, manifest.json
     * - media assets (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

export { proxy as middleware };
export default proxy;
