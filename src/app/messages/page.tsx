'use client';

import { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/usePolling';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageList } from '@/components/messages/MessageList';
import { MessageInput } from '@/components/messages/MessageInput';
import { NewMessageModal } from '@/components/messages/NewMessageModal';
import { Conversation } from '@/types/message';
import { useMessages } from '@/hooks/useMessages';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showNewMessage, setShowNewMessage] = useState(false);
  
  const { 
    currentConversation, 
    setCurrentConversation, 
    conversations,
    fetchConversations,
    fetchMessages
  } = useMessages();

  // Check for conversation ID in URL params
  const conversationId = searchParams.get('c');

  // Polling for new messages and conversations
  usePolling(
    async () => {
      if (user) {
        await fetchConversations();
        if (currentConversation) {
          await fetchMessages(currentConversation.id, 1);
        }
      }
    },
    {
      interval: 10000, // Poll every 10 seconds
      enabled: !!user && !authLoading,
      immediate: false,
    }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // If there's a conversation ID in the URL, select it
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      }
    }
  }, [conversationId, conversations, setCurrentConversation]);

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    // Update URL without triggering a page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('c', conversation.id);
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleNewMessage = () => {
    setShowNewMessage(true);
  };

  const handleNewConversationCreated = (conversation: Conversation) => {
    setShowNewMessage(false);
    setCurrentConversation(conversation);
    fetchConversations(); // Refresh the conversations list
    
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('c', conversation.id);
    window.history.replaceState({}, '', newUrl.toString());
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl h-[calc(100vh-2rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-1">
            <div className="h-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="lg:col-span-2">
            <div className="h-full bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl h-[calc(100vh-2rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onNewMessage={handleNewMessage}
            selectedConversationId={currentConversation?.id}
          />
        </div>

        {/* Messages Area */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1">
            <MessageList conversation={currentConversation} />
          </div>
          
          {/* Message Input */}
          {currentConversation && (
            <div className="mt-4">
              <MessageInput conversation={currentConversation} />
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        open={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onConversationCreated={handleNewConversationCreated}
      />
    </div>
  );
}