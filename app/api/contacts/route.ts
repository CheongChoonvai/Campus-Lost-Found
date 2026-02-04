import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/contacts - Get all conversations for the user
export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch related item titles
    const messages = data || [];
    const uniqueItemIds = [...new Set(messages.map((c: any) => c.item_id).filter(Boolean))];
    let itemMap = new Map<string, string>();

    if (uniqueItemIds.length > 0) {
      const { data: itemsData } = await supabaseAdmin
        .from('items')
        .select('id, title')
        .in('id', uniqueItemIds);
      itemMap = new Map((itemsData || []).map((i: any) => [i.id, i.title]));
    }

    // Attach item titles to messages
    for (const msg of messages) {
      (msg as any).item = { title: itemMap.get(msg.item_id) || null };
    }

    // Fetch profile names for other users
    const uniqueUserIds = [...new Set(
      messages.map((c: any) => c.sender_id === user.id ? c.recipient_id : c.sender_id)
    )];

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueUserIds);

    // Build initial map from profiles
    const userMap = new Map<string, string>();
    for (const profile of profiles || []) {
      if (profile.full_name) {
        userMap.set(profile.id, profile.full_name);
      }
    }

    // For users without a full_name, try to get their email from auth.users
    const usersWithoutName = uniqueUserIds.filter(id => !userMap.has(id));
    if (usersWithoutName.length > 0) {
      // Fetch emails from auth.users for users without profile names
      for (const userId of usersWithoutName) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (authUser?.user?.email) {
            userMap.set(userId, authUser.user.email);
          }
        } catch (e) {
          // ignore individual fetch errors
          console.error(`Failed to fetch user ${userId}:`, e);
        }
      }
    }

    // Final fallback to 'Unknown' for any remaining users
    for (const userId of uniqueUserIds) {
      if (!userMap.has(userId)) {
        userMap.set(userId, 'Unknown');
      }
    }

    // Group messages by conversation
    const conversationMap = new Map<string, any[]>();

    for (const contact of messages) {
      const otherId = contact.sender_id === user.id ? contact.recipient_id : contact.sender_id;
      const key = [user.id, otherId].sort().join('_');

      if (!conversationMap.has(key)) {
        conversationMap.set(key, []);
      }
      conversationMap.get(key)!.push(contact);
    }

    const conversations = Array.from(conversationMap.entries()).map(([key, msgs]) => {
      const sorted = msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const otherId = sorted[0].sender_id === user.id ? sorted[0].recipient_id : sorted[0].sender_id;

      return {
        otherId,
        otherEmail: userMap.get(otherId) || 'Unknown',
        messages: sorted,
        lastMessage: sorted[sorted.length - 1],
      };
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/contacts - Send a message
export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { item_id, recipient_id, message } = body;

    if (!item_id || !recipient_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, recipient_id, message' },
        { status: 400 }
      );
    }

    // Don't allow messaging yourself
    if (recipient_id === user.id) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('contacts').insert([
      {
        item_id,
        sender_id: user.id,
        recipient_id,
        message,
      },
    ]).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to send message' }, { status: 500 });
  }
}
