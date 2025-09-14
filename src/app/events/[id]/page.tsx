'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEvent } from '@/hooks/useEvent';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Video,
  ExternalLink,
  Settings 
} from 'lucide-react';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const { user } = useAuthContext();
  const { event, loading, error, fetchEvent, updateAttendance, removeAttendance } = useEvent();

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    }
  }, [eventId, fetchEvent]);

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) {
      router.push('/login');
      return;
    }
    await updateAttendance(eventId, status);
  };

  const handleRemoveRSVP = async () => {
    if (!user) return;
    await removeAttendance(eventId);
  };

  if (loading && !event) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Error Loading Event</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchEvent(eventId)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizer.id;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const now = new Date();
  const isPast = endDate < now;
  const isToday = startDate.toDateString() === now.toDateString();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getOrganizerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAttendanceColor = (status: string | null) => {
    switch (status) {
      case 'going': return 'bg-green-100 text-green-800';
      case 'maybe': return 'bg-yellow-100 text-yellow-800';
      case 'not_going': return 'bg-red-100 text-red-800';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/events">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Event Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  {isPast && <Badge variant="secondary">Past Event</Badge>}
                  {isToday && !isPast && <Badge className="bg-blue-100 text-blue-800">Today</Badge>}
                </div>
                
                <Link href={`/groups/${event.groupId}`}>
                  <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer mb-4">
                    {event.group.name}
                  </Badge>
                </Link>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Start: {formatDate(startDate)}</p>
                      <p className="text-gray-600">End: {formatDate(endDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {event.isVirtual ? (
                      <>
                        <Video className="h-5 w-5 text-gray-500" />
                        <div className="flex items-center gap-2">
                          <span>Virtual Event</span>
                          {event.virtualLink && user && event.userAttendance?.status === 'going' && (
                            <Button asChild variant="link" size="sm" className="p-0 h-auto">
                              <Link href={event.virtualLink} target="_blank">
                                Join Meeting <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5 text-gray-500" />
                        <span>{event.location}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p>
                        <span className="font-medium text-green-600">{event.goingCount} going</span>
                        {' • '}
                        <span className="font-medium text-yellow-600">{event.maybeCount} maybe</span>
                        {' • '}
                        <span className="text-gray-600">{event.notGoingCount} can't attend</span>
                      </p>
                      {event.maxAttendees && (
                        <p className="text-sm text-gray-600">
                          Maximum {event.maxAttendees} attendees
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {isOrganizer && (
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Organizer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organizer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-500 text-white">
                  {getOrganizerInitials(event.organizer.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{event.organizer.name}</p>
                <p className="text-sm text-gray-600">{event.organizer.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Response</CardTitle>
            </CardHeader>
            <CardContent>
              {event.userAttendance ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getAttendanceColor(event.userAttendance.status)}>
                      You're {event.userAttendance.status === 'not_going' ? 'not going' : event.userAttendance.status}
                    </Badge>
                  </div>
                  
                  {!isPast && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">Change your response:</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={event.userAttendance.status === 'going' ? 'default' : 'outline'}
                          onClick={() => handleRSVP('going')}
                          disabled={loading}
                        >
                          Going
                        </Button>
                        <Button
                          size="sm"
                          variant={event.userAttendance.status === 'maybe' ? 'default' : 'outline'}
                          onClick={() => handleRSVP('maybe')}
                          disabled={loading}
                        >
                          Maybe
                        </Button>
                        <Button
                          size="sm"
                          variant={event.userAttendance.status === 'not_going' ? 'default' : 'outline'}
                          onClick={() => handleRSVP('not_going')}
                          disabled={loading}
                        >
                          Can't Go
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoveRSVP}
                          disabled={loading}
                        >
                          Remove Response
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">You haven't responded to this event yet.</p>
                  
                  {!isPast && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRSVP('going')}
                        disabled={loading}
                      >
                        Going
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRSVP('maybe')}
                        disabled={loading}
                      >
                        Maybe
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRSVP('not_going')}
                        disabled={loading}
                      >
                        Can't Go
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Sign in to RSVP to this event</p>
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}