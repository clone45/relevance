import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Friendship from '@/models/Friendship';
import { authenticateUser } from '@/middleware/auth';

// GET /api/friends/requests - Get incoming friend requests
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
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'incoming'; // incoming, outgoing, or both

    let query: any = { status: 'pending' };

    if (type === 'incoming') {
      query.recipient = userAuth.userId;
    } else if (type === 'outgoing') {
      query.requester = userAuth.userId;
    } else {
      // both
      query.$or = [
        { recipient: userAuth.userId },
        { requester: userAuth.userId }
      ];
    }

    const friendRequests = await Friendship.find(query)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 });

    // Transform requests based on type
    const requests = friendRequests.map(friendship => {
      if (type === 'incoming' || (type === 'both' && friendship.recipient._id.toString() === userAuth.userId)) {
        // Incoming request - show requester info
        return {
          id: friendship._id.toString(),
          requester: {
            id: friendship.requester._id.toString(),
            name: friendship.requester.name,
            email: friendship.requester.email,
          },
          type: 'incoming',
          createdAt: friendship.createdAt,
        };
      } else {
        // Outgoing request - show recipient info
        return {
          id: friendship._id.toString(),
          recipient: {
            id: friendship.recipient._id.toString(),
            name: friendship.recipient.name,
            email: friendship.recipient.email,
          },
          type: 'outgoing',
          createdAt: friendship.createdAt,
        };
      }
    });

    return NextResponse.json({
      requests,
      total: requests.length,
    });

  } catch (error: any) {
    console.error('Get friend requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}