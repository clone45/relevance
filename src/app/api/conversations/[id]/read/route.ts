import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { authenticateUser } from '@/middleware/auth';

// POST /api/conversations/[id]/read - Mark messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Check if user is part of this conversation
    const conversation = await Conversation.findById(params.id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (!conversation.participants.includes(userAuth.userId as any)) {
      return NextResponse.json(
        { error: 'You are not part of this conversation' },
        { status: 403 }
      );
    }

    // Mark all unread messages in this conversation as read by current user
    await Message.updateMany(
      {
        conversationId: params.id,
        readBy: { $ne: userAuth.userId },
        senderId: { $ne: userAuth.userId }, // Don't mark own messages
      },
      {
        $addToSet: { readBy: userAuth.userId }
      }
    );

    return NextResponse.json({
      message: 'Messages marked as read',
    });

  } catch (error: any) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}