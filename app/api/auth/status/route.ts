import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ isAdmin: false }, { status: 400 });
  }

  const isAdmin = await isCurrentUserAdmin(email);
  return NextResponse.json({ isAdmin });
}
