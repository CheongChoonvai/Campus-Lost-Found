"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, MessageCircle, Inbox } from 'lucide-react';
import Brand from '@/components/site/brand';

export default function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const hideLogout = pathname?.startsWith('/dashboard/messages');
  const hideDashboard = pathname === '/dashboard' || pathname === '/dashboard/';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div>
            <Brand />
          </div>
          <div className="flex items-center gap-4">
            {!hideDashboard && (
              <Button asChild variant="outline">
                <Link href="/dashboard" className="flex items-center">
                  Dashboard
                </Link>
              </Button>
            )}

            <Button asChild variant="outline">
              <Link href="/dashboard/messages" className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/dashboard/my-items" className="flex items-center">
                <Inbox className="h-4 w-4 mr-2" />
                My Post
              </Link>
            </Button>

            <Button asChild>
              <Link href="/dashboard/report" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Report Item
              </Link>
            </Button>

            {!hideLogout && (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
