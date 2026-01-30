'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Calendar, MessageSquare, Trash2, Edit, User, Loader2, Clock, MapPinned } from 'lucide-react';
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
  const [contactLoading, setContactLoading] = useState(false);

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

        // Fetch item and profile in parallel for faster loading
        const [itemResult, profileResult] = await Promise.all([
          supabase.from('items').select('*').eq('id', params.id).single(),
          supabase.from('profiles').select('id, full_name').eq('id', user.id).single()
        ]);

        if (itemResult.error) throw itemResult.error;
        const data = itemResult.data;
        setItem(data);
        setIsOwner(data.user_id === user.id);

        // Fetch owner profile name if different from current user
        if (data.user_id && data.user_id !== user.id) {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user_id)
            .single();
          setOwnerName(ownerProfile?.full_name || null);
        } else if (data.user_id === user.id && profileResult.data) {
          setOwnerName(profileResult.data.full_name || null);
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
    if (contactLoading) return;

    setContactLoading(true);

    try {
      // 1. Check if we already have a conversation for this item
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('item_id', item.id)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${item.user_id}),and(sender_id.eq.${item.user_id},recipient_id.eq.${user.id})`)
        .limit(1);

      // 2. If no conversation, start one automatically
      if (!existingContacts || existingContacts.length === 0) {
        const initial = `Hi — I'm interested in this item titled "${item.title}". Can we chat?`;
        const { error } = await supabase
          .from('contacts')
          .insert([
            {
              item_id: item.id,
              sender_id: user.id,
              recipient_id: item.user_id,
              message: initial,
            },
          ]);

        if (error) throw error;
      }

      router.push(`/dashboard/messages?userId=${item.user_id}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
      setContactLoading(false);
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
    <div className="min-h-screen bg-background pb-12">
      {/* Header provided by app/dashboard/layout.tsx */}

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Items
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Image Column */}
          <div className="lg:col-span-3">
            <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted rounded-2xl overflow-hidden shadow-sm border border-border/50 relative group">
              {item.photo_url ? (
                <img
                  src={item.photo_url || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 space-y-4">
                  <div className="p-6 rounded-full bg-background/50 backdrop-blur-sm shadow-sm">
                   <MapPin className="h-12 w-12" />
                  </div>
                  <span className="text-sm font-medium uppercase tracking-widest">No Image Available</span>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex gap-2">
                 <Badge 
                   className={`text-sm px-3 py-1 shadow-lg backdrop-blur-md border-0 ${
                    item.item_type === 'lost'  ? 'bg-destructive/90 hover:bg-destructive' : 'bg-primary/90 hover:bg-primary'
                   }`}
                 >
                    {item.item_type === 'lost' ? 'Lost Item' : 'Found Item'}
                 </Badge>
                  {item.status === 'resolved' && (
                    <Badge variant="secondary" className="text-sm px-3 py-1 shadow-lg backdrop-blur-md bg-green-500/90 hover:bg-green-600 text-white border-0">
                      Resolved ✓
                    </Badge>
                  )}
              </div>
            </div>

             {/* Description Card (Mobile/Desktop consistent) */}
             <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  About this item
                </h3>
                <div className="bg-card rounded-xl border p-6 shadow-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {item.description}
                </div>
             </div>
          </div>

          {/* Sidebar / Details Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Block */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{item.title}</h1>
              <p className="text-lg text-muted-foreground mt-2 font-medium">{item.category}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-background shadow-xs text-primary">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Seen</p>
                    <p className="font-medium text-foreground mt-0.5">{item.location}</p>
                  </div>
                </div>

                 <div className="w-full h-px bg-border/50" />

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-background shadow-xs text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                   <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Posted</p>
                    <p className="font-medium text-foreground mt-0.5">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                  </div>
                </div>

                {ownerName && (
                  <>
                  <div className="w-full h-px bg-border/50" />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-background shadow-xs text-primary">
                      <User className="h-5 w-5" />
                    </div>
                     <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Posted By</p>
                      <p className="font-medium text-foreground mt-0.5 capitalize">{ownerName}</p>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-card rounded-xl border p-6 shadow-md sticky top-8">
               <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground tracking-wider">Actions</h3>
               <div className="space-y-3">
                {isOwner ? (
                  <>
                    <Button asChild variant="outline" className="w-full justify-start h-11">
                      <Link href={`/dashboard/item/${item.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Item
                      </Link>
                    </Button>
                    {item.status !== 'resolved' && (
                      <Button onClick={handleMarkReturned} className="w-full justify-start h-11" variant="secondary">
                         <span className="mr-2">✓</span>
                        {item.item_type === 'lost' ? 'Mark as Returned' : 'Mark as Claimed'}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full justify-start h-11"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleContact}
                    className="w-full h-12 text-base shadow-lg shadow-primary/20"
                    size="lg"
                    disabled={contactLoading}
                  >
                    {contactLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                    Start Conversation
                  </Button>
                )}
              </div>
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
