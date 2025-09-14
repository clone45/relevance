import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventAttendance from '@/models/EventAttendance';
import { authenticateUser } from '@/middleware/auth';

// GET /api/events/[id] - Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const event = await Event.findById((await params).id)
      .populate('organizer', 'name email')
      .populate('groupId', 'name');

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // If user is authenticated, get their attendance status
    let userAttendance = null;
    const userAuth = authenticateUser(request);
    if (userAuth) {
      const attendance = await EventAttendance.findOne({
        eventId: (await params).id,
        userId: userAuth.userId,
      });

      if (attendance) {
        userAttendance = {
          status: attendance.status,
        };
      }
    }

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

    return NextResponse.json({
      event: transformedEvent,
      userAttendance,
    });

  } catch (error: unknown) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event (organizer only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userAuth = authenticateUser(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const event = await Event.findById((await params).id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== userAuth.userId) {
      return NextResponse.json(
        { error: 'Only the event organizer can update this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      location, 
      isVirtual, 
      virtualLink, 
      maxAttendees 
    } = body;

    // Update fields if provided
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (startDate !== undefined) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = new Date(endDate);
    if (location !== undefined) event.location = location?.trim();
    if (isVirtual !== undefined) event.isVirtual = isVirtual;
    if (virtualLink !== undefined) event.virtualLink = virtualLink?.trim();
    if (maxAttendees !== undefined) event.maxAttendees = maxAttendees;

    await event.save();

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

    return NextResponse.json({
      message: 'Event updated successfully',
      event: transformedEvent,
    });

  } catch (error: unknown) {
    console.error('Update event error:', error);
    
    if (error && typeof error === 'object' && 'errors' in error && error.errors) {
      const validationErrors = Object.values(error.errors as Record<string, { message: string }>).map((err) => err.message);
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

// DELETE /api/events/[id] - Delete event (organizer only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userAuth = authenticateUser(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const event = await Event.findById((await params).id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== userAuth.userId) {
      return NextResponse.json(
        { error: 'Only the event organizer can delete this event' },
        { status: 403 }
      );
    }

    // Delete all attendance records first
    await EventAttendance.deleteMany({ eventId: (await params).id });
    
    // Delete the event
    await Event.findByIdAndDelete((await params).id);

    return NextResponse.json({
      message: 'Event deleted successfully',
    });

  } catch (error: unknown) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}