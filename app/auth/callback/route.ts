import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isCurrentUserAdmin } from '@/lib/supabase-server';

function getPublicOrigin(request: Request): string {
  // 1. Check APP_URL env variable (set by AI Studio)
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  // 2. Check headers
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  if (host) {
    return `${proto}://${host}`;
  }

  // 3. Fallback
  const { origin } = new URL(request.url);
  return origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  const publicOrigin = getPublicOrigin(request);

  if (error) {
    console.error('OAuth Callback Error:', error, errorDescription);
    return NextResponse.redirect(`${publicOrigin}/?error=${encodeURIComponent(errorDescription || 'auth_failed')}`);
  }

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code Exchange Error:', exchangeError.message);
      return NextResponse.redirect(`${publicOrigin}/?error=exchange_failed`);
    }

    if (data?.user) {
      const email = data.user.email;
      const isAdmin = await isCurrentUserAdmin(email);

      if (isAdmin && email) {
        try {
          // Sync admin email to the 'admins' table so that DB Row Level Security (RLS) handles them properly.
          // We use the service role client to bypass existing RLS and write the admin entry.
          const supabaseAdmin = await getSupabaseServerClient(true);
          const { error: syncError } = await supabaseAdmin
            .from('admins')
            .upsert({ email }, { onConflict: 'email' });

          if (syncError) {
            console.error('Failed to upsert admin email to admins table:', syncError.message);
          }
        } catch (e) {
          console.error('Error syncing admin:', e);
        }
        return NextResponse.redirect(`${publicOrigin}/admin`);
      }

      // Successful login for non-admin students
      return NextResponse.redirect(`${publicOrigin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${publicOrigin}/?error=no_code`);
}
