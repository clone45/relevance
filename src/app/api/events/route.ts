import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventAttendance from '@/models/EventAttendance';
import GroupMembership from '@/models/GroupMembership';
import { authenticateUser } from '@/middleware/auth';

// GET /api/events - Get events (for groups or user's events)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const upcoming = searchParams.get('upcoming') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = {};
    
    if (groupId) {
      query.groupId = groupId;
    } else {
      // For user's events, get events from groups they're in
      const userAuth = authenticateUser(request);
      if (!userAuth) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get user's group memberships
      const memberships = await GroupMembership.find({
        userId: userAuth.userId,
        isActive: true,
      }).select('groupId');

      const groupIds = memberships.map(m => m.groupId);
      if (groupIds.length === 0) {
        return NextResponse.json({
          events: [],
          total: 0,
          page,
          totalPages: 0,
        });
      }

      query.groupId = { $in: groupIds };
    }

    // Filter for upcoming events if requested
    if (upcoming) {
      query.startDate = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .populate('groupId', 'name')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    // Transform the response to match our frontend types
    const transformedEvents = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      maxAttendees: event.maxAttendees,
      groupId: event.groupId._id.toString(),
      group: {
        id: event.groupId._id.toString(),
        name: event.groupId.name,
      },
      organizer: {
        id: event.organizer._id.toString(),
        name: event.organizer.name,
        email: event.organizer.email,
      },
      attendeeCount: event.attendeeCount,
      goingCount: event.goingCount,
      maybeCount: event.maybeCount,
      notGoingCount: event.notGoingCount,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    return NextResponse.json({
      events: transformedEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const userAuth = authenticateUser(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      location, 
      isVirtual, 
      virtualLink, 
      maxAttendees, 
      groupId 
    } = body;

    if (!title || !description || !startDate || !endDate || !groupId) {
      return NextResponse.json(
        { error: 'Title, description, start date, end date, and group are required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const membership = await GroupMembership.findOne({
      groupId,
      userId: userAuth.userId,
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to create events' },
        { status: 403 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return NextResponse.json(
        { error: 'Event start date must be in the future' },
        { status: 400 }
      );
    }

    const event = new Event({
      title: title.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      location: location?.trim(),
      isVirtual: isVirtual || false,
      virtualLink: virtualLink?.trim(),
      maxAttendees,
      groupId,
      organizer: userAuth.userId,
    });

    await event.save();

    // Populate the event with organizer and group info
    await event.populate('organizer', 'name email');
    await event.populate('groupId', 'name');

    const transformedEvent = {
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      maxAttendees: event.maxAttendees,
      groupId: event.groupId._id.toString(),
      group: {
        id: event.groupId._id.toString(),
        name: event.groupId.name,
      },
      organizer: {
        id: event.organizer._id.toString(),
        name: event.organizer.name,
        email: event.organizer.email,
      },
      attendeeCount: event.attendeeCount,
      goingCount: event.goingCount,
      maybeCount: event.maybeCount,
      notGoingCount: event.notGoingCount,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    return NextResponse.json(
      { message: 'Event created successfully', event: transformedEvent },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create event error:', error);
    
    if (error.errors) {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}