'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import Link from 'next/link';
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

  const fetchConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Contact[]>();
      const otherUsers = new Map<string, string>();

      for (const contact of data || []) {
        const otherId = contact.sender_id === userId ? contact.recipient_id : contact.sender_id;
        const key = [userId, otherId].sort().join('_');

        if (!conversationMap.has(key)) {
          conversationMap.set(key, []);
        }
        conversationMap.get(key)!.push(contact);
      }

      // Fetch other user emails
      const uniqueIds = Array.from(new Set(
        (data || []).map(c => c.sender_id === userId ? c.recipient_id : c.sender_id)
      ));

      const { data: users } = await supabase
        .from('auth.users')
        .select('id, email')
        .in('id', uniqueIds);

      const userMap = new Map((users || []).map(u => [u.id, u.email]));

      const conversationList: Conversation[] = Array.from(conversationMap.entries()).map(
        ([key, messages]) => {
          const otherId = messages.some(m => m.sender_id === userId)
            ? messages.find(m => m.sender_id === userId)!.recipient_id
            : messages.find(m => m.recipient_id === userId)!.sender_id;

          return {
            otherId,
            otherEmail: userMap.get(otherId) || 'Unknown',
            messages: messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            lastMessage: messages[0],
          };
        }
      );

      setConversations(conversationList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('contacts').insert([
        {
          item_id: selectedConversation.messages[0].item_id,
          sender_id: user.id,
          recipient_id: selectedConversation.otherId,
          message: messageText,
        },
      ]);

      if (error) throw error;

      setMessageText('');
      await fetchConversations(user.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
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
                      className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                        selectedConversation?.otherId === conv.otherId ? 'bg-muted' : ''
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
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender_id === user?.id
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
