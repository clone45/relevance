'use client';

import { useFriendRequests } from '@/hooks/useFriendRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserCheck, UserX, X, Mail } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function FriendRequests() {
  const { 
    incomingRequests, 
    outgoingRequests, 
    loading, 
    error, 
    respondToFriendRequest, 
    cancelFriendRequest 
  } = useFriendRequests();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline', requesterName: string) => {
    try {
      setRespondingTo(requestId);
      await respondToFriendRequest(requestId, action);
      toast({
        title: action === 'accept' ? 'Friend request accepted' : 'Friend request declined',
        description: action === 'accept' 
          ? `You are now friends with ${requesterName}` 
          : `You declined ${requesterName}'s friend request`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const handleCancelRequest = async (requestId: string, recipientName: string) => {
    try {
      setCancelling(requestId);
      await cancelFriendRequest(requestId);
      toast({
        title: 'Friend request cancelled',
        description: `Your friend request to ${recipientName} has been cancelled`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCancelling(null);
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
          <p className="text-destructive">Error loading friend requests: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming">
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Outgoing ({outgoingRequests.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="incoming" className="mt-4">
            {incomingRequests.length === 0 ? (
              <p className="text-muted-foreground">No incoming friend requests</p>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {request.requester?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.requester?.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-1" />
                          {request.requester?.email}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespondToRequest(request.id, 'accept', request.requester?.name || '')}
                        disabled={respondingTo === request.id}
                      >
                        {respondingTo === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRespondToRequest(request.id, 'decline', request.requester?.name || '')}
                        disabled={respondingTo === request.id}
                      >
                        {respondingTo === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="outgoing" className="mt-4">
            {outgoingRequests.length === 0 ? (
              <p className="text-muted-foreground">No outgoing friend requests</p>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {request.recipient?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.recipient?.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-1" />
                          {request.recipient?.email}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request.id, request.recipient?.name || '')}
                        disabled={cancelling === request.id}
                      >
                        {cancelling === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}