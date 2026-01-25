'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Calendar, MessageSquare, Trash2, Edit, User } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import DeleteModal from '@/components/site/delete-modal';

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUser(user);

        // Fetch item
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setItem(data);
        setIsOwner(data.user_id === user.id);

        // Fetch owner profile name
        if (data.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user_id)
            .single();
          setOwnerName(profile?.full_name || null);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load item',
          variant: 'destructive',
        });
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async () => {
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: 'deleted' })
        .eq('id', params.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      });
      setShowDelete(false);
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleContact = async () => {
    if (!item || !user) return;

    try {
      const initial = `Hi — I'm interested in this item titled "${item.title}". Can we chat?`;
      const { data, error } = await supabase
        .from('contacts')
        .insert([
          {
            item_id: item.id,
            sender_id: user.id,
            recipient_id: item.user_id,
            message: initial,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: 'Message sent',
        description: 'You can continue the conversation in Messages.',
      });
      router.push('/dashboard/messages');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const handleMarkReturned = async () => {
    if (!item) return;
    try {
      const resolvedAt = new Date().toISOString();
      const { error } = await supabase
        .from('items')
        .update({ status: 'resolved', resolved_at: resolvedAt })
        .eq('id', item.id);

      if (error) throw error;

      setItem({ ...item, status: 'resolved', resolved_at: resolvedAt });

      const actionText = item.item_type === 'lost' ? 'returned' : 'claimed';
      toast({
        title: 'Item updated',
        description: `Item marked as ${actionText}.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-muted-foreground">Item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header provided by app/dashboard/layout.tsx */}

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Items
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Image */}
          <div className="md:col-span-1">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {item.photo_url ? (
                <img
                  src={item.photo_url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Title and Badge */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{item.title}</h1>
                <div className="flex gap-2 mt-2">
                  <Badge
                    className={`${item.item_type === 'lost'
                      ? 'bg-destructive'
                      : 'bg-accent'
                      }`}
                  >
                    {item.item_type === 'lost' ? 'Lost' : 'Found'}
                  </Badge>
                  {item.status === 'resolved' && (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      Resolved ✓
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Category and Location */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium text-foreground">{item.category}</p>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
              </div>
              {ownerName && (
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Posted by {ownerName}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{item.description}</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              {isOwner ? (
                <>
                  <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                    <Link href={`/dashboard/item/${item.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Item
                    </Link>
                  </Button>
                  {item.status !== 'resolved' && (
                    <Button onClick={handleMarkReturned} className="flex-1">
                      {item.item_type === 'lost' ? 'Mark as Returned' : 'Mark as Claimed'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleContact}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Owner
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <DeleteModal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
