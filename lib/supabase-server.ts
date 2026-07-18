import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServerClient(useServiceRole = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase Server Client initialization failed: URL or ${
        useServiceRole ? 'Service Role Key' : 'Anon Key'
      } is not defined.`
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Helper to check if a user is the Admin based on the ADMIN_EMAIL environment variable
export async function isCurrentUserAdmin(userEmail: string | undefined): Promise<boolean> {
  const adminEmailEnv = process.env.ADMIN_EMAIL || 'anishkumar.07wi@gmail.com';
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === adminEmailEnv.trim().toLowerCase();
}
