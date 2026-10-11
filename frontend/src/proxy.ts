import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface AuthMeResponse {
  success: boolean;
  user?: {
    userId: string;
    role: 'citizen' | 'official' | 'agency' | 'moderator' | 'admin';
    displayName: string;
    email?: string;
    status?: 'active' | 'pending' | 'suspended';
    officialOfficeId?: string;
  };
  message?: string;
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
  const token = request.cookies.get('raise_token')?.value || request.cookies.get('accessToken')?.value;

  let validatedUser: AuthMeResponse['user'] | null = null;
  let isTokenStale = false;

  if (token) {
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000/api';

    try {
      const verifyRes = await fetch(`${apiUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (verifyRes.ok) {
        const data: AuthMeResponse = await verifyRes.json();
        if (data.success && data.user) {
          validatedUser = data.user;
        } else {
          isTokenStale = true;
        }
      } else {
        isTokenStale = true;
      }
    } catch {
      // Backend unreachable or offline during dev/test
      // Fallback: decode JWT safely to inspect basic token structure if offline
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          if (decoded.exp && decoded.exp * 1000 > Date.now()) {
            validatedUser = {
              userId: decoded.userId,
              role: decoded.role || 'citizen',
              displayName: decoded.displayName || 'User',
              status: decoded.status || 'active',
            };
          } else {
            isTokenStale = true;
          }
        }
      } catch {
        isTokenStale = true;
      }
    }
  }

  // 1. Authenticated User Handling
  if (validatedUser) {
    // If a signed-in user opens an auth page, redirect to their home
    if (isAuthRoute(pathname)) {
      const homePath = getRoleHome(validatedUser.role);
      const res = NextResponse.redirect(new URL(homePath, request.url));
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
