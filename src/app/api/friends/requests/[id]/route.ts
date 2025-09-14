import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import { authenticateUser } from '@/middleware/auth';

// PUT /api/friends/requests/[id] - Accept or decline friend request
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
    
    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (accept or decline)' },
        { status: 400 }
      );
    }

    const friendship = await Friendship.findById((await params).id);
    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Check if current user is the recipient of this request
    if (friendship.recipient.toString() !== userAuth.userId) {
      return NextResponse.json(
        { error: 'You can only respond to friend requests sent to you' },
        { status: 403 }
      );
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json(
        { error: 'This friend request has already been responded to' },
        { status: 400 }
      );
    }

    // Update friendship status
    friendship.status = action === 'accept' ? 'accepted' : 'declined';
    await friendship.save();

    await friendship.populate('requester', 'name email');
    await friendship.populate('recipient', 'name email');

    const transformedFriendship = {
      id: friendship._id.toString(),
      requester: {
        id: friendship.requester._id.toString(),
        name: friendship.requester.name,
        email: friendship.requester.email,
      },
      recipient: {
        id: friendship.recipient._id.toString(),
        name: friendship.recipient.name,
        email: friendship.recipient.email,
      },
      status: friendship.status,
      createdAt: friendship.createdAt,
      updatedAt: friendship.updatedAt,
    };

    return NextResponse.json({
      message: `Friend request ${action}ed successfully`,
      friendship: transformedFriendship,
    });

  } catch (error: unknown) {
    console.error('Respond to friend request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/friends/requests/[id] - Cancel friend request (requester) or remove friendship
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
    
    const friendship = await Friendship.findById((await params).id);
    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    // Check if current user is part of this friendship
    const isRequester = friendship.requester.toString() === userAuth.userId;
    const isRecipient = friendship.recipient.toString() === userAuth.userId;

    if (!isRequester && !isRecipient) {
      return NextResponse.json(
        { error: 'You are not part of this friendship' },
        { status: 403 }
      );
    }

    // Different logic based on friendship status and user role
    if (friendship.status === 'pending') {
      if (!isRequester) {
        return NextResponse.json(
          { error: 'Only the requester can cancel a pending friend request' },
          { status: 403 }
        );
      }
      // Delete the pending request
      await Friendship.findByIdAndDelete((await params).id);
      return NextResponse.json({
        message: 'Friend request cancelled successfully',
      });
    } else if (friendship.status === 'accepted') {
      // Either friend can end the friendship
      await Friendship.findByIdAndDelete((await params).id);
      return NextResponse.json({
        message: 'Friendship ended successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Cannot delete this friendship' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('Delete friendship error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}