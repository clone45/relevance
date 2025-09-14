'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EventCard } from './EventCard';
import { useEvents } from '@/hooks/useEvents';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EventListProps {
  groupId?: string;
  showGroup?: boolean;
}

export function EventList({ groupId, showGroup = true }: EventListProps) {
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  
  const { 
    events, 
    loading, 
    error, 
    totalPages, 
    currentPage, 
    fetchEvents, 
    clearError 
  } = useEvents();

  useEffect(() => {
    fetchEvents(1, groupId, upcomingOnly);
  }, [fetchEvents, groupId, upcomingOnly]);

  const handleLoadMore = () => {
    fetchEvents(currentPage + 1, groupId, upcomingOnly);
  };

  const handleRetry = () => {
    clearError();
    fetchEvents(1, groupId, upcomingOnly);
  };

  const handleUpcomingToggle = (checked: boolean) => {
    setUpcomingOnly(checked);
  };

  if (loading && events.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRetry} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="upcoming"
          checked={upcomingOnly}
          onCheckedChange={handleUpcomingToggle}
        />
        <Label htmlFor="upcoming">Show upcoming events only</Label>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">
            {upcomingOnly ? 'No upcoming events' : 'No events found'}
          </h3>
          <p className="text-gray-600">
            {groupId 
              ? 'Be the first to create an event in this group!'
              : upcomingOnly 
                ? 'No upcoming events in your groups. Check back later!'
                : 'Join some groups to see events!'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                showGroup={showGroup}
              />
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="text-center">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More Events'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Loading indicator for additional events */}
      {loading && events.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
            <span>Loading more events...</span>
          </div>
        </div>
      )}
    </div>
  );
}