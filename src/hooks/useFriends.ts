import { useState, useEffect } from 'react';
import { Friend, FriendsListResponse } from '@/types/friend';

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/friends');
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }

      const data: FriendsListResponse = await response.json();
      setFriends(data.friends);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (recipientId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }

      return await response.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${friendshipId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove friend');
      }

      await fetchFriends();
      return await response.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return {
    friends,
    loading,
    error,
    fetchFriends,
    sendFriendRequest,
    removeFriend,
  };
}