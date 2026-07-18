import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass system routes and public assets
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isValidHttpUrl = (str: string | undefined) => {
    if (!str) return false;
    try {
      const parsed = new URL(str);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  if (!url || !anonKey || !isValidHttpUrl(url)) {
    // If environment variables are not defined, allow requests to proceed without authentication middleware blocks
    return NextResponse.next();
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Get active session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (isAdminRoute || isDashboardRoute) {
    if (!user) {
      // Direct unauthenticated users to landing page
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'auth_required');
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminRoute) {
      const adminEmailEnv = process.env.ADMIN_EMAIL || 'anishkumar.07wi@gmail.com';
      const isUserAdmin =
        user.email &&
        user.email.trim().toLowerCase() === adminEmailEnv.trim().toLowerCase();

      if (!isUserAdmin) {
        // Direct unauthorized users away from admin panel
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        redirectUrl.searchParams.set('error', 'unauthorized_admin');
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
