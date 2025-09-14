'use client';

import { useState, useCallback } from 'react';
import { EventWithUserAttendance } from '@/types/event';

interface UseEventReturn {
  event: EventWithUserAttendance | null;
  loading: boolean;
  error: string | null;
  fetchEvent: (eventId: string) => Promise<void>;
  updateAttendance: (eventId: string, status: 'going' | 'maybe' | 'not_going') => Promise<boolean>;
  removeAttendance: (eventId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useEvent(): UseEventReturn {
  const [event, setEvent] = useState<EventWithUserAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchEvent = useCallback(async (eventId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      setEvent({
        ...result.event,
        id: result.event._id || result.event.id,
        userAttendance: result.userAttendance,
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAttendance = useCallback(async (
    eventId: string, 
    status: 'going' | 'maybe' | 'not_going'
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Update local event state
      setEvent(prev => prev ? {
        ...prev,
        userAttendance: { status },
      } : null);

      // Refetch event to get updated counts
      await fetchEvent(eventId);

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, [fetchEvent]);

  const removeAttendance = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Update local event state
      setEvent(prev => prev ? {
        ...prev,
        userAttendance: null,
      } : null);

      // Refetch event to get updated counts
      await fetchEvent(eventId);

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, [fetchEvent]);

  return {
    event,
    loading,
    error,
    fetchEvent,
    updateAttendance,
    removeAttendance,
    clearError,
  };
}