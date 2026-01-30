'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  item_type: 'lost' | 'found';
  photo_url: string | null;
  created_at: string;
  posterName?: string | null;
  user_id: string;
}

interface ItemGridProps {
  items: Item[];
  currentUserId?: string;
}

export function ItemGrid({ items, currentUserId }: ItemGridProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  const handleChat = async (item: Item) => {
    if (!currentUserId || !item.user_id) return;
    
    // Prevent multiple clicks
    if (loadingChatId) return;

    setLoadingChatId(item.id);

    try {
      // 1. Check if we already have a conversation for this item
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('item_id', item.id)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${item.user_id}),and(sender_id.eq.${item.user_id},recipient_id.eq.${currentUserId})`)
        .limit(1);

      // 2. If no conversation, start one automatically
      if (!existingContacts || existingContacts.length === 0) {
        const initialMessage = `Hi, I'm interested in your ${item.item_type} item "${item.title}".`;
        
        const { error } = await supabase
          .from('contacts')
          .insert([
            {
              item_id: item.id,
              sender_id: currentUserId,
              recipient_id: item.user_id,
              message: initialMessage,
            },
          ]);

        if (error) throw error;
      }

      // 3. Redirect to messages page with the user selected
      router.push(`/dashboard/messages?userId=${item.user_id}`);
      
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to open chat window',
        variant: 'destructive',
      });
      setLoadingChatId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const isOwner = currentUserId === item.user_id;

          return (
            <Card key={item.id} className="group p-0 gap-0 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border-muted-foreground/10 hover:border-primary/20">
              {/* Item Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                {item.photo_url ? (
                  <img
                    src={item.photo_url || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 space-y-2">
                    <div className="p-4 rounded-full bg-background/50 backdrop-blur-sm">
                      <MapPin className="h-8 w-8" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                   <Badge 
                    variant={item.item_type === 'lost' ? 'destructive' : 'default'}
                    className="shadow-sm backdrop-blur-md"
                  >
                    {item.item_type === 'lost' ? 'Lost' : 'Found'}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pt-4 pb-2 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-muted font-medium text-foreground/80">
                      {item.category}
                    </span>
                    {item.posterName && (
                      <span>• Posted by {item.posterName}</span>
                    )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-[2.5rem]">
                  {item.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    <span className="line-clamp-1">{item.location}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                    <span className="line-clamp-1">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 pb-4 flex gap-2">
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1 border-primary/20 hover:bg-primary/5 hover:text-primary group/btn" 
                  size="sm"
                >
                  <Link href={`/dashboard/item/${item.id}`}>
                    Details
                    <ArrowRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                
                {!isOwner && currentUserId && (
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all ml-1"
                    onClick={() => handleChat(item)}
                    disabled={loadingChatId === item.id}
                  >
                    {loadingChatId === item.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Chat
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
  );
}
