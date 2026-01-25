 'use client';

import React from 'react';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Contact {
  id: string;
  item_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
  item?: {
    title: string;
  };
}

interface Conversation {
  otherId: string;
  otherEmail: string;
  messages: Contact[];
  lastMessage: Contact;
}

export default function MessagesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUser(user);
        await fetchConversations(user.id);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Polling fallback: refresh conversations every 3 seconds for realtime updates
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchConversations(user.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related item titles so we can show them in the conversation header
      const uniqueItemIds = Array.from(new Set((data || []).map((c: any) => c.item_id).filter(Boolean)));
      let itemMap = new Map<string, string>();
      if (uniqueItemIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('items')
          .select('id, title')
          .in('id', uniqueItemIds);
        itemMap = new Map(((itemsData || []) as any[]).map(i => [i.id, i.title]));
      }

      // Group messages by conversation
      const conversationMap = new Map<string, Contact[]>();
      const otherUsers = new Map<string, string>();

      for (const contact of data || []) {
        // attach item title if available
        (contact as any).item = { title: itemMap.get(contact.item_id) };
        const otherId = contact.sender_id === userId ? contact.recipient_id : contact.sender_id;
        const key = [userId, otherId].sort().join('_');

        if (!conversationMap.has(key)) {
          conversationMap.set(key, []);
        }
        conversationMap.get(key)!.push(contact);
      }

      // Fetch other user emails
      const uniqueIds = Array.from(new Set(
        (data || []).map((c: Contact) => c.sender_id === userId ? c.recipient_id : c.sender_id)
      ));

      // Try to fetch display names from a `profiles` table.
      // `auth.users` is not exposed via PostgREST, so querying it will fail with 404.
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueIds);

      const userMap = new Map<string, string>((profiles || []).map((u: any) => [u.id, u.full_name || 'Unknown']));

      const conversationList: Conversation[] = Array.from(conversationMap.entries()).map(
        ([key, messages]) => {
          // sort messages oldest -> newest
          const sorted = (messages || []).slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          const otherId = sorted.some(m => m.sender_id === userId)
            ? sorted.find(m => m.sender_id === userId)!.recipient_id
            : sorted.find(m => m.recipient_id === userId)!.sender_id;

          return {
            otherId,
            otherEmail: userMap.get(otherId) || 'Unknown',
            messages: sorted,
            lastMessage: sorted[sorted.length - 1],
          };
        }
      );

      setConversations(conversationList);

      // Also update selected conversation if it's in the list, to sync new messages
      setSelectedConversation((prev) => {
        if (!prev) return prev;
        const updated = conversationList.find(c => c.otherId === prev.otherId);
        if (updated) {
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    }
  };

  // Realtime subscription: listen for new contacts and merge them into conversations
  useEffect(() => {
    if (!user) return;

    // Subscribe to messages where the user is either sender or recipient
    const channel = supabase
      .channel(`contacts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `sender_id=eq.${user.id}`,
        },
        async (payload: any) => handleNewMessage(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload: any) => handleNewMessage(payload.new)
      )
      .subscribe();

    const handleNewMessage = async (newMsg: Contact) => {
      try {
        // Avoid duplicates - check if message already exists
        setConversations((prev) => {
          const allMsgIds = prev.flatMap(c => c.messages.map(m => m.id));
          if (allMsgIds.includes(newMsg.id)) return prev;
          return prev; // Will be updated below
        });

        // fetch item title for the message
        if (newMsg.item_id) {
          const { data: itemData } = await supabase
            .from('items')
            .select('id, title')
            .eq('id', newMsg.item_id)
            .single();
          (newMsg as any).item = { title: itemData?.title };
        } else {
          (newMsg as any).item = { title: undefined };
        }

        // Fetch the other user's name
        const otherId = newMsg.sender_id === user.id ? newMsg.recipient_id : newMsg.sender_id;
        let otherName = 'Unknown';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', otherId)
            .single();
          otherName = profile?.full_name || 'Unknown';
        } catch (e) {
          // ignore
        }

        setConversations((prev) => {
          // Check if message already exists
          const existingConv = prev.find((c) => c.otherId === otherId);
          if (existingConv) {
            const msgExists = existingConv.messages.some(m => m.id === newMsg.id);
            if (msgExists) return prev;

            const updated = {
              ...existingConv,
              messages: [...existingConv.messages, newMsg],
              lastMessage: newMsg,
            };
            return prev.map((c) => (c.otherId === otherId ? updated : c));
          }

          // New conversation
          const conv: Conversation = {
            otherId,
            otherEmail: otherName,
            messages: [newMsg],
            lastMessage: newMsg,
          };
          return [conv, ...prev];
        });

        setSelectedConversation((prev) => {
          if (!prev) return prev;
          if (prev.otherId === otherId) {
            const msgExists = prev.messages.some(m => m.id === newMsg.id);
            if (msgExists) return prev;
            return { ...prev, messages: [...prev.messages, newMsg], lastMessage: newMsg };
          }
          return prev;
        });
      } catch (e) {
        console.error('Realtime handler error', e);
      }
    };

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) { }
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;

    const msgContent = messageText.trim();
    setSending(true);
    setMessageText('');

    try {
      const { data, error } = await supabase.from('contacts').insert([
        {
          item_id: selectedConversation.messages[0].item_id,
          sender_id: user.id,
          recipient_id: selectedConversation.otherId,
          message: msgContent,
        },
      ]).select().single();

      if (error) throw error;

      // Optimistically update the UI immediately
      if (data) {
        const newMsg: Contact = {
          ...data,
          item: selectedConversation.messages[0]?.item,
        };

        setSelectedConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMsg],
            lastMessage: newMsg,
          };
        });

        setConversations((prev) => {
          return prev.map((c) => {
            if (c.otherId === selectedConversation.otherId) {
              return {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: newMsg,
              };
            }
            return c;
          });
        });
      }
    } catch (error) {
      // Restore the message on error
      setMessageText(msgContent);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // auto-scroll messages to bottom when conversation changes or new messages arrive
  const messagesRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!messagesRef.current) return;
    // small timeout to allow DOM to update
    setTimeout(() => {
      try {
        messagesRef.current!.scrollTop = messagesRef.current!.scrollHeight;
      } catch (e) {
        // ignore
      }
    }, 50);
  }, [selectedConversation, conversations, sending]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header is provided by app/dashboard/layout.tsx */}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversations
                </div>
                <Badge>{conversations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.otherId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-muted transition-colors ${selectedConversation?.otherId === conv.otherId ? 'bg-muted' : ''
                        }`}
                    >
                      <p className="font-medium text-foreground text-sm">{conv.otherEmail}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conv.lastMessage.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">{selectedConversation.otherEmail}</CardTitle>
                  <CardDescription>
                    Item: {selectedConversation.messages[0]?.item?.title || 'Unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                          }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
