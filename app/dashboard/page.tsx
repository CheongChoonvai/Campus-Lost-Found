'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Plus, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      } else {
        setUser(user);
        fetchItems();
      }
    };

    checkAuth();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (itemType !== 'all') {
        query = query.eq('item_type', itemType);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
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
  }, [itemType, category, searchQuery]);

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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                L&F
              </div>
              <span className="text-lg font-bold text-foreground">Campus Lost & Found</span>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild>
                <a href="/dashboard/report">
                  <Plus className="h-4 w-4 mr-2" />
                  Report Item
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Button asChild>
                  <a href="/dashboard/report">Report a Lost or Found Item</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ItemGrid items={items} />
          )}
        </div>
      </main>
    </div>
  );
}

export { Loading };
