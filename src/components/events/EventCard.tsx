'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Event } from '@/types/event';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEvents } from '@/hooks/useEvents';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Video,
  MoreHorizontal,
  Edit,
  Trash2 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageIconButton } from '@/components/messages/MessageButton';

interface EventCardProps {
  event: Event;
  showGroup?: boolean;
  userAttendance?: 'going' | 'maybe' | 'not_going' | null;
}

export function EventCard({ event, showGroup = true, userAttendance }: EventCardProps) {
  const { user } = useAuthContext();
  const { updateAttendance, deleteEvent, loading } = useEvents();

  const isOrganizer = user?.id === event.organizer.id;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const now = new Date();
  const isPast = endDate < now;
  const isToday = startDate.toDateString() === now.toDateString();

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) return;
    await updateAttendance(event.id, status);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await deleteEvent(event.id);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatDateRange = () => {
    const sameDay = startDate.toDateString() === endDate.toDateString();
    if (sameDay) {
      return `${formatDate(startDate)} - ${endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    } else {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
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
    <Link href={`/events/${event.id}`}>
      <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer ${isPast ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                {isPast && <Badge variant="secondary">Past</Badge>}
                {isToday && !isPast && <Badge className="bg-blue-100 text-blue-800">Today</Badge>}
              </div>
              
              {showGroup && (
                <Link href={`/groups/${event.groupId}`} onClick={(e) => e.stopPropagation()}>
                  <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer mb-2">
                    {event.group.name}
                  </Badge>
                </Link>
              )}
            </div>

            {isOrganizer && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {event.description}
          </p>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {event.isVirtual ? (
                <>
                  <Video className="h-4 w-4" />
                  <span>Virtual Event</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {event.goingCount} going • {event.maybeCount} maybe
                {event.maxAttendees && ` • ${event.maxAttendees} max`}
              </span>
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-2 mb-4">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-gray-500 text-white text-xs">
                {getOrganizerInitials(event.organizer.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              Organized by {event.organizer.name}
            </span>
            {!isOrganizer && (
              <MessageIconButton userId={event.organizer.id} />
            )}
          </div>

          {/* RSVP Status */}
          {user && userAttendance && (
            <div className="mb-4">
              <Badge className={getAttendanceColor(userAttendance)}>
                You're {userAttendance === 'not_going' ? 'not going' : userAttendance}
              </Badge>
            </div>
          )}

          {/* RSVP Buttons */}
          {user && !isPast && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={userAttendance === 'going' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRSVP('going');
                }}
                disabled={loading}
                className="flex-1 text-xs"
              >
                Going
              </Button>
              <Button
                size="sm"
                variant={userAttendance === 'maybe' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRSVP('maybe');
                }}
                disabled={loading}
                className="flex-1 text-xs"
              >
                Maybe
              </Button>
              <Button
                size="sm"
                variant={userAttendance === 'not_going' ? 'default' : 'outline'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRSVP('not_going');
                }}
                disabled={loading}
                className="flex-1 text-xs"
              >
                Can't Go
              </Button>
            </div>
          )}

          {!user && !isPast && (
            <Button asChild size="sm" className="w-full">
              <Link href="/login" onClick={(e) => e.stopPropagation()}>
                Sign In to RSVP
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}