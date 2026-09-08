import { NextResponse } from 'next/server';
import { getSupabaseServerClient, isCurrentUserAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = !!user?.email && await isCurrentUserAdmin(user.email);
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}
