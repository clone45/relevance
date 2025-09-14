'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Conversation } from '@/types/message';
import { useMessages } from '@/hooks/useMessages';
import { Search, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewMessageModal({ open, onClose, onConversationCreated }: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const { sendMessage, error, clearError } = useMessages();

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`);
      const result = await response.json();
      
      if (response.ok) {
        setSearchResults(result.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !message.trim()) return;

    setLoading(true);
    clearError();

    try {
      const result = await sendMessage({
        content: message.trim(),
        recipientId: selectedUser.id,
      });

      if (result) {
        // Create conversation response from the message
        const conversation: Conversation = {
          id: result.conversationId,
          participants: [
            {
              id: selectedUser.id,
              name: selectedUser.name,
              email: selectedUser.email,
            }
          ],
          otherParticipant: {
            id: selectedUser.id,
            name: selectedUser.name,
            email: selectedUser.email,
          },
          lastMessage: {
            id: result.id,
            content: result.content,
            senderId: result.senderId,
            createdAt: result.createdAt,
          },
          lastActivity: result.createdAt,
          unreadCount: 0,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };

        onConversationCreated(conversation);
        handleClose();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setMessage('');
    clearError();
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          {!selectedUser ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search for users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchLoading && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                    <span className="text-sm">Searching...</span>
                  </div>
                </div>
              )}

              {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No users found for "{searchQuery}"</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-500 text-white text-sm">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected User & Message */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-500 text-white text-sm">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedUser.name}</p>
                    <p className="text-xs text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  maxLength={2000}
                  autoFocus
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {message.length}/2000
                  </span>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}