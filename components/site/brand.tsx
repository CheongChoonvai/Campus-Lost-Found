"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function Brand() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
        const display = profile?.full_name || user.email || null;
        if (mounted) setName(display);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
        L&F
      </div>
      <div className="flex flex-col">
        <Link href="/dashboard" className="text-lg font-bold text-foreground">Campus Lost & Found</Link>
        {name ? <span className="text-xs text-muted-foreground">Welcome, {name}</span> : null}
      </div>
    </div>
  );
}
