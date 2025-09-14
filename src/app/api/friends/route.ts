import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import { authenticateUser } from '@/middleware/auth';

// GET /api/friends - Get user's friends
export async function GET(request: NextRequest) {
  try {
    const userAuth = authenticateUser(request);
    
    if (!userAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Find all accepted friendships where user is either requester or recipient
    const friendships = await Friendship.find({
      $or: [
        { requester: userAuth.userId },
        { recipient: userAuth.userId }
      ],
      status: 'accepted'
    })
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .sort({ updatedAt: -1 });

    // Transform to get the friend (not the current user) from each friendship
    const friends = friendships.map(friendship => {
      const isRequester = friendship.requester._id.toString() === userAuth.userId;
      const friend = isRequester ? friendship.recipient : friendship.requester;
      
      return {
        id: friend._id.toString(),
        name: friend.name,
        email: friend.email,
        friendshipId: friendship._id.toString(),
        friendedAt: friendship.updatedAt, // When friendship was accepted
      };
    });

    return NextResponse.json({
      friends,
      total: friends.length,
    });

  } catch (error: unknown) {
    console.error('Get friends error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/friends - Send friend request
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
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    if (recipientId === userAuth.userId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if friendship already exists in either direction
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: userAuth.userId, recipient: recipientId },
        { requester: recipientId, recipient: userAuth.userId }
      ]
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already friends with this user' },
          { status: 400 }
        );
      } else if (existingFriendship.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already pending' },
          { status: 400 }
        );
      } else if (existingFriendship.status === 'blocked') {
        return NextResponse.json(
          { error: 'Cannot send friend request to this user' },
          { status: 403 }
        );
      }
    }

    // Create new friend request
    const friendship = new Friendship({
      requester: userAuth.userId,
      recipient: recipientId,
      status: 'pending',
    });

    await friendship.save();

    // Populate the friendship with user info
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

    return NextResponse.json(
      { message: 'Friend request sent successfully', friendship: transformedFriendship },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Send friend request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}