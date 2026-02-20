'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getItems, deleteItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function MyItemsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUser(user);
        setLoading(true);

        // Fetch items posted by the current user via API. Do not restrict by
        // status so the user can see resolved items and edit their status again.
        const { items: data } = await getItems({ userId: user.id });
        setItems(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your items',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMyItems();
  }, []);

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteItem(itemId);

      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Posted Items</h1>
          <p className="text-muted-foreground">
            Manage all items you've reported as lost or found
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">You haven't posted any items yet</p>
              <Button asChild>
                <Link href="/dashboard/report">Report an Item</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-48 aspect-square md:aspect-auto bg-muted flex-shrink-0">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                          <Badge variant={item.item_type === 'lost' ? 'destructive' : 'default'}>
                            {item.item_type === 'lost' ? 'Lost' : 'Found'}
                          </Badge>
                          {item.status === 'resolved' && (
                            <Badge variant="secondary" className="bg-green-500 text-white">
                              Resolved
                            </Badge>
                          )}
                          {item.status === 'deleted' && (
                            <Badge variant="outline">Deleted</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm"
                      >
                        <Link href={`/dashboard/item/${item.id}`}>
                          View
                        </Link>
                      </Button>
                      
                      {item.status !== 'deleted' && (
                        <>
                          <Button 
                            asChild 
                            variant="outline" 
                            size="sm"
                          >
                            <Link href={`/dashboard/item/${item.id}/edit`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
