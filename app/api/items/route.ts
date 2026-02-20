import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/items - List items with filters (PUBLIC - no auth required)
export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Auth is optional for browsing items
    const user = await getAuthUser(req);

    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get('itemType') || 'all';
    const category = searchParams.get('category') || 'all';
    // If a status query param is provided we'll respect it. If no status is provided
    // and the request is not scoped to a specific user, default to 'active'. If
    // a `userId` is provided and no status is given, return all statuses for that
    // user's items so they can see resolved/deleted items in their dashboard.
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId'); // For my-items page

    let query = supabaseAdmin.from('items').select('*').order('created_at', { ascending: false });

    // Apply status filter only when an explicit status is requested, or when
    // there is no userId and no status provided (default to 'active' for public listing).
    if (status) {
      if (status !== 'all') {
        query = query.eq('status', status);
      }
    } else if (!searchParams.get('userId')) {
      // No status provided and this is not a user-scoped request -> show only active
      query = query.eq('status', 'active');
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (itemType !== 'all') {
      query = query.eq('item_type', itemType);
    }

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch poster names from profiles
    const items = data || [];
    const uniqueUserIds = [...new Set(items.map((it: any) => it.user_id))];
    
    if (uniqueUserIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
      
      for (const item of items) {
        (item as any).posterName = profileMap.get(item.user_id) || null;
      }
    }

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/items - Create a new item
export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, location, item_type, photo_url } = body;

    // Validation
    if (!title || !description || !category || !location || !item_type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, location, item_type' },
        { status: 400 }
      );
    }

    if (!['lost', 'found'].includes(item_type)) {
      return NextResponse.json({ error: 'item_type must be "lost" or "found"' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('items').insert([
      {
        user_id: user.id,
        title,
        description,
        category,
        location,
        item_type,
        photo_url: photo_url || null,
        status: 'active',
      },
    ]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create item' }, { status: 500 });
  }
}
