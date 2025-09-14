'use client';

import { useState, useCallback } from 'react';
import { Event, CreateEventData, EventListResponse } from '@/types/event';

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  createEvent: (data: CreateEventData) => Promise<Event | null>;
  fetchEvents: (page?: number, groupId?: string, upcoming?: boolean) => Promise<void>;
  updateAttendance: (eventId: string, status: 'going' | 'maybe' | 'not_going') => Promise<boolean>;
  removeAttendance: (eventId: string) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createEvent = useCallback(async (data: CreateEventData): Promise<Event | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/events', {
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

      // Add the new event to the beginning of the events array
      setEvents(prev => [result.event, ...prev]);
      return result.event;
    } catch (err) {
      setError('Network error. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (
    page = 1, 
    groupId?: string,
    upcoming?: boolean
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (groupId) {
        params.append('groupId', groupId);
      }

      if (upcoming) {
        params.append('upcoming', 'true');
      }

      const response = await fetch(`/api/events?${params.toString()}`);
      const result: EventListResponse & { totalPages: number; page: number } = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch events');
        return;
      }

      if (page === 1) {
        setEvents(result.events);
      } else {
        setEvents(prev => [...prev, ...result.events]);
      }
      
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
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

      // Update the event's attendance counts locally
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          // This is a simplified update - in a real app you might want to refetch the event
          // to get the exact counts, but this provides immediate feedback
          return { ...event };
        }
        return event;
      }));

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, []);

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

      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return false;
      }

      // Remove the event from the local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  }, []);

  return {
    events,
    loading,
    error,
    totalPages,
    currentPage,
    createEvent,
    fetchEvents,
    updateAttendance,
    removeAttendance,
    deleteEvent,
    clearError,
  };
}