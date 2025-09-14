'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Message, Conversation } from '@/types/message';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { MessageCircle } from 'lucide-react';

interface MessageListProps {
  conversation: Conversation | null;
}

export function MessageList({ conversation }: MessageListProps) {
  const { user } = useAuthContext();
  const { messages, loading, fetchMessages, markAsRead } = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id);
      // Mark conversation as read when viewing it
      if (conversation.unreadCount > 0) {
        markAsRead(conversation.id);
      }
    }
  }, [conversation, fetchMessages, markAsRead]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  if (!conversation) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
            <p className="text-gray-600">Choose a conversation to start messaging</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
{conversation.participants.length > 0 ? conversation.participants[0].name : 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-3 rounded-lg ${
                  i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-200'
                } animate-pulse`}>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gray-500 text-white">
              {conversation.participants.length > 0 ?
                getInitials(conversation.participants[0].name) :
                '?'
              }
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">
{conversation.participants.length > 0 ? conversation.participants[0].name : 'Unknown User'}
            </CardTitle>
            <p className="text-sm text-gray-600">
{conversation.participants.length > 0 ? conversation.participants[0].email : ''}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex justify-center my-4">
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(new Date(dateKey))}
                  </span>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-2">
                  {dayMessages.map((message, index) => {
                    const isOwnMessage = message.senderId === user?.id;
                    const showAvatar = !isOwnMessage && (
                      index === 0 || 
                      dayMessages[index - 1]?.senderId !== message.senderId
                    );

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                          isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          {showAvatar && !isOwnMessage && (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-gray-400 text-white text-xs">
                                {getInitials(message.sender.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`px-3 py-2 rounded-lg ${
                            isOwnMessage 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          } ${!showAvatar && !isOwnMessage ? 'ml-8' : ''}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                              {message.isEdited && ' (edited)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
    </Card>
  );
}