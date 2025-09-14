'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Conversation } from '@/types/message';
import { useMessages } from '@/hooks/useMessages';
import { Send } from 'lucide-react';

interface MessageInputProps {
  conversation: Conversation | null;
}

export function MessageInput({ conversation }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { sendMessage, error } = useMessages();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Clear message when switching conversations
    setMessage('');
  }, [conversation?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !conversation || sending) return;

    setSending(true);
    const trimmedMessage = message.trim();
    setMessage(''); // Clear input immediately for better UX

    const result = await sendMessage({
      content: trimmedMessage,
      conversationId: conversation.id,
    });

    if (!result) {
      // If failed, restore the message
      setMessage(trimmedMessage);
    }
    
    setSending(false);
    
    // Focus back to textarea
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  if (!conversation) {
    return null;
  }

  return (
    <Card className="border-t">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${conversation.otherParticipant?.name}...`}
                className="min-h-[40px] max-h-[120px] resize-none"
                disabled={sending}
                maxLength={2000}
              />
            </div>
            
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || sending}
              className="h-10 px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {message.length}/2000
            </span>
            
            {error && (
              <span className="text-xs text-red-600">
                {error}
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </CardContent>
    </Card>
  );
}