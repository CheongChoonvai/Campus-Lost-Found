import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/items/[id] - Get a single item
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Fetch owner profile name
    let ownerName = null;
    if (data.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', data.user_id)
        .single();
      ownerName = profile?.full_name || null;
    }

    return NextResponse.json({
      item: data,
      ownerName,
      isOwner: data.user_id === user.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch item' }, { status: 500 });
  }
}

// PATCH /api/items/[id] - Update an item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('items')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this item' }, { status: 403 });
    }

    const body = await req.json();
    const allowedFields = ['title', 'description', 'category', 'location', 'item_type', 'photo_url', 'status', 'resolved_at'];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id] - Soft delete an item (set status to 'deleted')
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('items')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this item' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('items')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete item' }, { status: 500 });
  }
}
