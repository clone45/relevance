'use client';

import { useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AddFriend() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const { sendFriendRequest } = useFriends();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId: string, userName: string) => {
    try {
      setSendingRequest(userId);
      await sendFriendRequest(userId);
      toast({
        title: 'Friend request sent',
        description: `Friend request sent to ${userName}`,
      });
      
      setSearchResults(results => 
        results.filter(user => user.id !== userId)
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Search Results</h3>
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{user.name}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-1" />
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/profile/${user.id}`}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSendFriendRequest(user.id, user.name)}
                    disabled={sendingRequest === user.id}
                  >
                    {sendingRequest === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery && !searching && searchResults.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            No users found matching "{searchQuery}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}