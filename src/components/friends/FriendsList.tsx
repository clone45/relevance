'use client';

import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, UserMinus, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function FriendsList() {
  const { friends, loading, error, removeFriend } = useFriends();
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    try {
      setRemovingFriend(friendshipId);
      await removeFriend(friendshipId);
      toast({
        title: 'Friend removed',
        description: `You are no longer friends with ${friendName}`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setRemovingFriend(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading friends: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Friends ({friends.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <p className="text-muted-foreground">You don&apos;t have any friends yet. Start by sending friend requests!</p>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{friend.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-1" />
                      {friend.email}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Friends since {new Date(friend.friendedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/profile/${friend.id}`}>
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFriend(friend.friendshipId, friend.name)}
                    disabled={removingFriend === friend.friendshipId}
                  >
                    {removingFriend === friend.friendshipId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Friend
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}