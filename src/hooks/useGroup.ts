'use client';

import { useState, useCallback } from 'react';
import { Group } from '@/types/group';

interface GroupDetails extends Group {
  userMembership?: {
    role: 'owner' | 'admin' | 'moderator' | 'member';
    joinedAt: Date;
  } | null;
}

interface UseGroupReturn {
  group: GroupDetails | null;
  loading: boolean;
  error: string | null;
  fetchGroup: (groupId: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useGroup(): UseGroupReturn {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchGroup = useCallback(async (groupId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      setGroup({
        ...result.group,
        id: result.group._id,
        userMembership: result.userMembership,
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Update local state to reflect membership
      setGroup(prev => prev ? {
        ...prev,
        memberCount: prev.memberCount + 1,
        userMembership: {
          role: 'member',
          joinedAt: new Date(),
        }
      } : null);

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Update local state to reflect leaving
      setGroup(prev => prev ? {
        ...prev,
        memberCount: prev.memberCount - 1,
        userMembership: null,
      } : null);

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    group,
    loading,
    error,
    fetchGroup,
    joinGroup,
    leaveGroup,
    clearError,
  };
}