/**
 * One-off migration script to copy users from `auth.users` into `public.profiles`.
 * Usage:
 *   - Create a file `.env` next to this repo or set env vars in your shell:
 *       SUPABASE_URL=https://xyz.supabase.co
 *       SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *   - Run: `node scripts/migrate_auth_users_to_profiles.js`
 *
 * This script requires the Supabase service_role key and must be run from a
 * secure environment (server or developer machine). It lists all auth users via
 * the admin API and upserts a profile row with `id` and `full_name` into
 * `public.profiles`.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function listAllUsers() {
  const all = [];
  // Try to use the admin.listUsers API with pagination. The exact signature
  // may vary between supabase-js versions; this handles common response shapes.
  let page = 0;
  const perPage = 100;

  while (true) {
    const opts = { per_page: perPage, page };
    let res;
    try {
      // Preferred admin API
      if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.listUsers === 'function') {
        res = await supabase.auth.admin.listUsers(opts);
      } else {
        // Fallback: attempt to hit the GoTrue admin endpoint directly
        const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users?per_page=${perPage}&page=${page}`;
        const r = await fetch(url, { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` } });
        if (!r.ok) throw new Error(`Admin users fetch failed: ${r.status} ${r.statusText}`);
        const users = await r.json();
        res = { data: users };
      }
    } catch (err) {
      console.error('Failed to list users:', err.message || err);
      process.exit(1);
    }

    // Normalize response to array of users
    let users = res.data?.users || res.data || [];
    if (!Array.isArray(users)) users = [];

    if (users.length === 0) break;

    all.push(...users);
    if (users.length < perPage) break;
    page += 1;
  }

  return all;
}

function pickFullName(user) {
  // Try multiple common locations for full name
  if (!user) return null;
  const tryPaths = [
    () => user.user_metadata && user.user_metadata.full_name,
    () => user.raw_user_meta_data && user.raw_user_meta_data.full_name,
    () => user.user_metadata && user.user_metadata.fullName,
    () => user.raw_user_meta_data && user.raw_user_meta_data.fullName,
    () => user.email,
  ];

  for (const fn of tryPaths) {
    try {
      const v = fn();
      if (v && typeof v === 'string' && v.trim() !== '') return v.trim();
    } catch (e) {
      // ignore
    }
  }
  return null;
}

async function upsertProfiles(profiles) {
  if (profiles.length === 0) return { count: 0 };
  // Chunk inserts to reduce payload size
  const chunkSize = 200;
  let inserted = 0;
  for (let i = 0; i < profiles.length; i += chunkSize) {
    const chunk = profiles.slice(i, i + chunkSize);
    const { error } = await supabase.from('profiles').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Failed to upsert profiles chunk:', error.message || error);
      // continue with next chunk
    } else {
      inserted += chunk.length;
    }
  }
  return { count: inserted };
}

async function main() {
  console.log('Listing users from auth.admin...');
  const users = await listAllUsers();
  console.log(`Found ${users.length} users`);

  const profiles = users.map((u) => {
    const id = u.id || u.user?.id || (u.user && u.user.id) || null;
    const full_name = pickFullName(u) || null;
    return { id, full_name };
  }).filter(p => p.id);

  console.log(`Preparing to upsert ${profiles.length} profiles`);

  const result = await upsertProfiles(profiles.map(p => ({ id: p.id, full_name: p.full_name })));

  console.log(`Upserted approx ${result.count} profiles`);
  console.log('Done');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
