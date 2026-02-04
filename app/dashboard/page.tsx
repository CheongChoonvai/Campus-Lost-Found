 'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { getItems, Item } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { ItemGrid } from '@/components/items/item-grid';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import Loading from './loading';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemType, setItemType] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Allow browsing without login - just set user if logged in
      if (user) {
        setUser(user);
      }
      // Always fetch items regardless of auth status
      fetchItems();
    };

    checkAuth();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { items: itemsData } = await getItems({
        itemType,
        category,
        status,
        search: searchQuery,
      });

      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 500);
    return () => clearTimeout(timer);
  }, [itemType, category, status, searchQuery]);

  // Realtime updates: listen for INSERT/UPDATE/DELETE on `items` and merge changes
  useEffect(() => {
    if (!user) return;

    const matchesFilters = (it: any) => {
      if (status && it.status !== status) return false;
      if (itemType !== 'all' && it.item_type !== itemType) return false;
      if (category !== 'all' && it.category !== category) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!((it.title || '').toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q))) return false;
      }
      return true;
    };

    const channel = supabase
      .channel('items-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'items' },
        async (payload: any) => {
          const newItem = payload.new;
          if (!matchesFilters(newItem)) return;

          // fetch poster name if possible
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newItem.user_id)
              .maybeSingle();
            (newItem as any).posterName = profile?.full_name || null;
          } catch (e) {
            (newItem as any).posterName = null;
          }

          setItems((prev) => {
            if (prev.some((p) => p.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });

          // show toast for others' posts
          try {
            if (user && newItem.user_id !== user.id) {
              toast({
                title: 'New item posted',
                description: `${newItem.title || 'An item'} was posted`,
              });
            }
          } catch (e) {
            // ignore toast errors
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items' },
        async (payload: any) => {
          const updated = payload.new;

          // fetch poster name if missing
          if (!updated.posterName && updated.user_id) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', updated.user_id)
                .maybeSingle();
              (updated as any).posterName = profile?.full_name || null;
            } catch (e) {
              (updated as any).posterName = null;
            }
          }

          setItems((prev) => {
            const exists = prev.some((p) => p.id === updated.id);
            const matches = matchesFilters(updated);
            if (exists && !matches) return prev.filter((p) => p.id !== updated.id);
            if (exists && matches) return prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
            if (!exists && matches) return [updated, ...prev];
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'items' },
        (payload: any) => {
          const oldItem = payload.old;
          setItems((prev) => prev.filter((p) => p.id !== oldItem.id));
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, [user, itemType, category, status, searchQuery]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const categories = [
    'Electronics',
    'Clothing',
    'Accessories',
    'Keys',
    'Wallet',
    'Books',
    'Bags',
    'Documents',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header is provided by app/dashboard/layout.tsx */}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Items</CardTitle>
            <CardDescription>Find lost or found items on campus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Item Type
                </label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="lost">Lost Items</SelectItem>
                    <SelectItem value="found">Found Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Items</SelectItem>
                    <SelectItem value="resolved">Resolved Items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {itemType === 'all' ? 'All Items' : itemType === 'lost' ? 'Lost Items' : 'Found Items'}
            </h2>
            <p className="text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No items found</p>
                {user ? (
                  <Button asChild>
                    <a href="/dashboard/report">Report a Lost or Found Item</a>
                  </Button>
                ) : (
                  <Button asChild>
                    <a href="/auth/login">Sign in to Report an Item</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <ItemGrid items={items} currentUserId={user?.id} />
          )}
        </div>
      </main>
    </div>
  );
}

export { Loading };
