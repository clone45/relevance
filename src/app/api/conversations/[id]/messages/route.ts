import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { authenticateUser } from '@/middleware/auth';

// GET /api/conversations/[id]/messages - Get messages in a conversation
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      conversationId: params.id 
    })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ 
      conversationId: params.id 
    });

    // Transform messages
    const transformedMessages = messages.map(message => ({
      id: message._id.toString(),
      content: message.content,
      senderId: message.senderId._id.toString(),
      sender: {
        id: message.senderId._id.toString(),
        name: message.senderId.name,
        email: message.senderId.email,
      },
      conversationId: message.conversationId.toString(),
      readBy: message.readBy.map(id => id.toString()),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
    }));

    // Reverse to show oldest first in UI (but we fetched newest first for pagination)
    transformedMessages.reverse();

    return NextResponse.json({
      messages: transformedMessages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
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

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create the message
    const message = new Message({
      content: content.trim(),
      senderId: userAuth.userId,
      conversationId: params.id,
    });

    await message.save();

    // Update conversation's last message and activity
    conversation.lastMessageId = message._id as any;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('senderId', 'name email');

    const transformedMessage = {
      id: message._id.toString(),
      content: message.content,
      senderId: message.senderId._id.toString(),
      sender: {
        id: message.senderId._id.toString(),
        name: message.senderId.name,
        email: message.senderId.email,
      },
      conversationId: message.conversationId.toString(),
      readBy: message.readBy.map(id => id.toString()),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
    };

    return NextResponse.json(
      { message: 'Message sent successfully', data: transformedMessage },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Send message error:', error);
    
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