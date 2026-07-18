import { getSupabaseServerClient } from './supabase-server';

/**
 * Server-side helper to get the currently logged-in user from Supabase.
 * Safe to call in Server Components, API Routes, and Server Actions.
 */
export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return null;
  }
}

/**
 * Server-side helper to check if the current user has Admin privileges.
 * Privileges are determined by matching user email with the ADMIN_EMAIL environment variable.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return false;
  }
  
  const adminEmailEnv = process.env.ADMIN_EMAIL || 'anishkumar.07wi@gmail.com';
  return user.email.trim().toLowerCase() === adminEmailEnv.trim().toLowerCase();
}

/**
 * Server-side helper that asserts the current user is an admin.
 * Throws an error if they are not, preventing unauthorized execution.
 */
export async function requireAdmin(): Promise<boolean> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  return true;
}
