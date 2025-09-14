'use client';

import { useState, useCallback } from 'react';
import { Message, Conversation, CreateMessageData, ConversationListResponse, MessageListResponse } from '@/types/message';

interface UseMessagesReturn {
  conversations: Conversation[];
  messages: Message[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  sendMessage: (data: CreateMessageData) => Promise<Message | null>;
  createConversation: (recipientId: string) => Promise<Conversation | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  clearError: () => void;
}

export function useMessages(): UseMessagesReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchConversations = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/conversations');
      const result: ConversationListResponse = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch conversations');
        return;
      }

      setConversations(result.conversations);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (
    conversationId: string,
    page = 1
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      const response = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`);
      const result: MessageListResponse = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch messages');
        return;
      }

      if (page === 1) {
        setMessages(result.messages);
      } else {
        // For pagination, prepend older messages
        setMessages(prev => [...result.messages, ...prev]);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data: CreateMessageData): Promise<Message | null> => {
    setError(null);
    
    try {
      let conversationId = data.conversationId;
      
      // If no conversation ID but we have recipientId, create conversation first
      if (!conversationId && data.recipientId) {
        const conversation = await createConversation(data.recipientId);
        if (!conversation) return null;
        conversationId = conversation.id;
        setCurrentConversation(conversation);
      }

      if (!conversationId) {
        setError('No conversation selected');
        return null;
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: data.content }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return null;
      }

      // Add the new message to the current messages
      setMessages(prev => [...prev, result.data]);
      
      // Update conversations list with new last message
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              lastMessage: {
                id: result.data.id,
                content: result.data.content,
                senderId: result.data.senderId,
                createdAt: result.data.createdAt,
              },
              lastActivity: result.data.createdAt,
            }
          : conv
      ));

      return result.data;
    } catch (err) {
      setError('Network error. Please try again.');
      return null;
    }
  }, []);

  const createConversation = useCallback(async (recipientId: string): Promise<Conversation | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return null;
      }

      // Add or update conversation in list
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === result.conversation.id);
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = result.conversation;
          return updated;
        } else {
          // Add new conversation
          return [result.conversation, ...prev];
        }
      });

      return result.conversation;
    } catch (err) {
      setError('Network error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      });

      // Update local conversation to reset unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (err) {
      // Fail silently for read receipts
      console.error('Failed to mark as read:', err);
    }
  }, []);

  return {
    conversations,
    messages,
    currentConversation,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markAsRead,
    setCurrentConversation,
    clearError,
  };
}