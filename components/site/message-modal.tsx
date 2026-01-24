"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  initialMessage: string;
  onClose: () => void;
  onSend: (message: string) => Promise<void> | void;
}

export default function MessageModal({ open, initialMessage, onClose, onSend }: Props) {
  const [message, setMessage] = useState(initialMessage || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessage(initialMessage || '');
  }, [initialMessage, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Send message to owner</h3>
        <p className="text-sm text-muted-foreground mb-4">Edit your message before sending.</p>
        <div className="mb-4">
          <Textarea value={message} onChange={(e: any) => setMessage(e.target.value)} rows={4} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!message.trim()) return;
              try {
                setSending(true);
                await onSend(message.trim());
                onClose();
              } finally {
                setSending(false);
              }
            }}
            className="bg-primary"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
