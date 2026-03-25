import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
