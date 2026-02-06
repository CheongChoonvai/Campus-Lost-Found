"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, MessageCircle, Inbox, LogIn, User } from 'lucide-react';
import Brand from '@/components/site/brand';

export default function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const hideLogout = pathname?.startsWith('/dashboard/messages');
  const hideDashboard = pathname === '/dashboard' || pathname === '/dashboard/';

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

            {/* Show these only when logged in */}
            {user && (
              <>
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

                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="h-4 w-4" />
                  </Link>
                </Button>

                {!hideLogout && (
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Show login button when not logged in */}
            {!loading && !user && (
              <Button asChild>
                <Link href="/auth/login" className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
