import { useState, useEffect } from 'react';
import { FriendRequest, FriendRequestsResponse } from '@/types/friend';

export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      
      const [incomingRes, outgoingRes] = await Promise.all([
        fetch('/api/friends/requests?type=incoming'),
        fetch('/api/friends/requests?type=outgoing'),
      ]);

      if (!incomingRes.ok || !outgoingRes.ok) {
        throw new Error('Failed to fetch friend requests');
      }

      const incomingData: FriendRequestsResponse = await incomingRes.json();
      const outgoingData: FriendRequestsResponse = await outgoingRes.json();

      setIncomingRequests(incomingData.requests);
      setOutgoingRequests(outgoingData.requests);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to friend request');
      }

      await fetchFriendRequests();
      return await response.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel friend request');
      }

      await fetchFriendRequests();
      return await response.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  return {
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    fetchFriendRequests,
    respondToFriendRequest,
    cancelFriendRequest,
  };
}