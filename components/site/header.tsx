"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchName() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try to load profile row (full_name). Fallback to user.email
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const display = profile?.full_name || (user.email ?? null);
        if (mounted) setName(display);
      } catch (err) {
        // ignore errors; leave name null
        // eslint-disable-next-line no-console
        console.warn('Failed to load user name:', err);
      }
    }
    fetchName();
    return () => { mounted = false };
  }, []);

  if (!name) return null;

  return (
    <div style={{padding: '8px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
      <span style={{color: 'var(--muted-foreground, #6b7280)', fontSize: 14}}>Welcome, </span>
      <span style={{marginLeft: 8, fontWeight: 600}}>{name}</span>
    </div>
  );
}
