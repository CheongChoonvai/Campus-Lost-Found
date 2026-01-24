import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  // Keep module evaluation from crashing; respond with clear error at runtime.
  // The handler will still run but will return a helpful JSON error.
}

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase service role key or URL not configured' }, { status: 500 });
  }

  const userId = req.headers.get('x-user-id') || 'anonymous';
  const originalName = req.headers.get('x-file-name') || `${Date.now()}`;
  const contentType = req.headers.get('content-type') || 'application/octet-stream';

  try {
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = originalName.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('item-photos')
      .upload(filePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data } = supabaseAdmin.storage.from('item-photos').getPublicUrl(filePath);
    return NextResponse.json({ publicUrl: data.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
