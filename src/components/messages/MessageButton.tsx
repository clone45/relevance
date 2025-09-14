'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { MessageCircle } from 'lucide-react';

interface MessageButtonProps {
  userId: string;
  userName: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
}

export function MessageButton({ 
  userId, 
  userName, 
  size = 'sm', 
  variant = 'outline',
  className = ''
}: MessageButtonProps) {
  const { user } = useAuthContext();
  const { createConversation } = useMessages();

  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const conversation = await createConversation(userId);
    if (conversation) {
      // Redirect to messages page with the conversation selected
      window.location.href = `/messages?c=${conversation.id}`;
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className={`${className}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Message {userName}
    </Button>
  );
}

// Simplified version for inline use
export function MessageIconButton({ 
  userId, 
  size = 'sm', 
  variant = 'ghost' 
}: { 
  userId: string; 
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
}) {
  const { user } = useAuthContext();
  const { createConversation } = useMessages();

  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const conversation = await createConversation(userId);
    if (conversation) {
      window.location.href = `/messages?c=${conversation.id}`;
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className="h-8 w-8 p-0"
      title="Send message"
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
}