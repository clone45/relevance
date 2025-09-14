'use client';

import { useState } from 'react';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, RefreshCw, Mail, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function FriendSuggestions() {
  const { suggestions, loading, error, fetchSuggestions, removeSuggestion } = useFriendSuggestions();
  const { sendFriendRequest } = useFriends();
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendFriendRequest = async (userId: string, userName: string) => {
    try {
      setSendingRequest(userId);
      await sendFriendRequest(userId);
      toast({
        title: 'Friend request sent',
        description: `Friend request sent to ${userName}`,
      });
      removeSuggestion(userId);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissing(userId);
    setTimeout(() => {
      removeSuggestion(userId);
      setDismissing(null);
    }, 300);
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
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading suggestions: {error}</p>
            <Button onClick={fetchSuggestions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Friend Suggestions</CardTitle>
          <Button onClick={fetchSuggestions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No friend suggestions available at the moment.
          </p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-opacity ${
                  dismissing === suggestion.id ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {suggestion.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{suggestion.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Mail className="h-4 w-4 mr-1" />
                      {suggestion.email}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.reasonLabel}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/profile/${suggestion.id}`}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    disabled={dismissing === suggestion.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleSendFriendRequest(suggestion.id, suggestion.name)}
                    disabled={sendingRequest === suggestion.id || dismissing === suggestion.id}
                  >
                    {sendingRequest === suggestion.id ? (
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
      </CardContent>
    </Card>
  );
}