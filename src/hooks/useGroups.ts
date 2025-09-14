'use client';

import { useState, useCallback } from 'react';
import { Group, CreateGroupData, GroupListResponse } from '@/types/group';

interface UseGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  createGroup: (data: CreateGroupData) => Promise<Group | null>;
  fetchGroups: (page?: number, filters?: { category?: string; search?: string }) => Promise<void>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createGroup = useCallback(async (data: CreateGroupData): Promise<Group | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return null;
      }

      return result.group;
    } catch (err) {
      setError('Network error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async (
    page = 1, 
    filters?: { category?: string; search?: string }
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      if (filters?.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`/api/groups?${params.toString()}`);
      const result: GroupListResponse & { totalPages: number; page: number } = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch groups');
        return;
      }

      setGroups(result.groups);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
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

      // Update the group's member count locally
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, memberCount: group.memberCount + 1 }
          : group
      ));

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

      // Update the group's member count locally
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, memberCount: group.memberCount - 1 }
          : group
      ));

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    groups,
    loading,
    error,
    totalPages,
    currentPage,
    createGroup,
    fetchGroups,
    joinGroup,
    leaveGroup,
    clearError,
  };
}