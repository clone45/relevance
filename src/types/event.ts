export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  groupId: string;
  group: {
    id: string;
    name: string;
  };
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  attendeeCount: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  userId: string;
  status: 'going' | 'maybe' | 'not_going';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  groupId: string;
}

export interface EventResponse {
  message: string;
  event: Event;
}

export interface EventListResponse {
  events: Event[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EventWithUserAttendance extends Event {
  userAttendance?: {
    status: 'going' | 'maybe' | 'not_going';
  } | null;
}