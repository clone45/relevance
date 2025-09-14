import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMembership from '@/models/GroupMembership';
import { authenticateUser } from '@/middleware/auth';

// POST /api/groups/[id]/join - Join a group
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
    
    const group = await Group.findById((await params).id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await GroupMembership.findOne({
      groupId: (await params).id,
      userId: userAuth.userId,
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        return NextResponse.json(
          { error: 'You are already a member of this group' },
          { status: 400 }
        );
      } else {
        // Reactivate membership
        existingMembership.isActive = true;
        existingMembership.joinedAt = new Date();
        await existingMembership.save();
      }
    } else {
      // Create new membership
      const membership = new GroupMembership({
        groupId: (await params).id,
        userId: userAuth.userId,
        role: 'member',
      });
      await membership.save();
    }

    // Update member count
    await Group.findByIdAndUpdate((await params).id, {
      $inc: { memberCount: 1 }
    });

    return NextResponse.json({
      message: 'Successfully joined the group',
    });

  } catch (error: unknown) {
    console.error('Join group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/join - Leave a group
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
    
    const membership = await GroupMembership.findOne({
      groupId: (await params).id,
      userId: userAuth.userId,
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    // Prevent owner from leaving (they must transfer ownership or delete group)
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'Group owner cannot leave the group. Transfer ownership or delete the group.' },
        { status: 400 }
      );
    }

    // Deactivate membership
    membership.isActive = false;
    await membership.save();

    // Update member count
    await Group.findByIdAndUpdate((await params).id, {
      $inc: { memberCount: -1 }
    });

    return NextResponse.json({
      message: 'Successfully left the group',
    });

  } catch (error: unknown) {
    console.error('Leave group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}