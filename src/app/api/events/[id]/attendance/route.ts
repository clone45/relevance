import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventAttendance from '@/models/EventAttendance';
import { authenticateUser } from '@/middleware/auth';

// POST /api/events/[id]/attendance - Update attendance status
export async function POST(
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

    const body = await request.json();
    const { status } = body;

    if (!status || !['going', 'maybe', 'not_going'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (going, maybe, or not_going)' },
        { status: 400 }
      );
    }

    // Check if event is at capacity (for 'going' status only)
    if (status === 'going' && event.maxAttendees && event.goingCount >= event.maxAttendees) {
      return NextResponse.json(
        { error: 'Event is at full capacity' },
        { status: 400 }
      );
    }

    // Find existing attendance or create new one
    let attendance = await EventAttendance.findOne({
      eventId: (await params).id,
      userId: userAuth.userId,
    });

    const oldStatus = attendance?.status;

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = new EventAttendance({
        eventId: (await params).id,
        userId: userAuth.userId,
        status,
      });
      await attendance.save();
    }

    // Update event counts
    const attendanceUpdates: any = {};
    
    // Decrease old status count
    if (oldStatus) {
      if (oldStatus === 'going') attendanceUpdates.$inc = { ...attendanceUpdates.$inc, goingCount: -1 };
      if (oldStatus === 'maybe') attendanceUpdates.$inc = { ...attendanceUpdates.$inc, maybeCount: -1 };
      if (oldStatus === 'not_going') attendanceUpdates.$inc = { ...attendanceUpdates.$inc, notGoingCount: -1 };
    }

    // Increase new status count
    if (status === 'going') attendanceUpdates.$inc = { ...attendanceUpdates.$inc, goingCount: 1 };
    if (status === 'maybe') attendanceUpdates.$inc = { ...attendanceUpdates.$inc, maybeCount: 1 };
    if (status === 'not_going') attendanceUpdates.$inc = { ...attendanceUpdates.$inc, notGoingCount: 1 };

    // Update total attendee count (going + maybe)
    const newAttendeeCount = await EventAttendance.countDocuments({
      eventId: (await params).id,
      status: { $in: ['going', 'maybe'] },
    });

    await Event.findByIdAndUpdate((await params).id, {
      ...attendanceUpdates,
      attendeeCount: newAttendeeCount,
    });

    return NextResponse.json({
      message: 'Attendance updated successfully',
      status,
    });

  } catch (error: unknown) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/attendance - Remove attendance status
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
    
    const attendance = await EventAttendance.findOne({
      eventId: (await params).id,
      userId: userAuth.userId,
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'No attendance record found' },
        { status: 400 }
      );
    }

    const oldStatus = attendance.status;

    // Delete the attendance record
    await EventAttendance.findByIdAndDelete(attendance._id);

    // Update event counts
    const attendanceUpdates: any = { $inc: {} };
    
    if (oldStatus === 'going') attendanceUpdates.$inc.goingCount = -1;
    if (oldStatus === 'maybe') attendanceUpdates.$inc.maybeCount = -1;
    if (oldStatus === 'not_going') attendanceUpdates.$inc.notGoingCount = -1;

    // Update total attendee count
    const newAttendeeCount = await EventAttendance.countDocuments({
      eventId: (await params).id,
      status: { $in: ['going', 'maybe'] },
    });

    await Event.findByIdAndUpdate((await params).id, {
      ...attendanceUpdates,
      attendeeCount: newAttendeeCount,
    });

    return NextResponse.json({
      message: 'Attendance removed successfully',
    });

  } catch (error: unknown) {
    console.error('Remove attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}