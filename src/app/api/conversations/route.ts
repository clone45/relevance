import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { authenticateUser } from '@/middleware/auth';

// GET /api/conversations - Get user's conversations
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
    
    const conversations = await Conversation.find({
      participants: userAuth.userId
    })
      .populate('participants', 'name email')
      .populate('lastMessageId')
      .sort({ lastActivity: -1 });

    const transformedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other participant (not the current user)
        const otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userAuth.userId
        );

        // Get unread message count for current user
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          readBy: { $ne: userAuth.userId },
          senderId: { $ne: userAuth.userId }, // Don't count own messages as unread
        });

        // Get last message details
        let lastMessage = null;
        if (conv.lastMessageId) {
          const lastMsg = await Message.findById(conv.lastMessageId)
            .populate('senderId', 'name email');
          
          if (lastMsg) {
            lastMessage = {
              id: lastMsg._id.toString(),
              content: lastMsg.content,
              senderId: lastMsg.senderId._id.toString(),
              createdAt: lastMsg.createdAt,
            };
          }
        }

        return {
          id: conv._id.toString(),
          participants: conv.participants.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
            email: p.email,
          })),
          otherParticipant: otherParticipant ? {
            id: otherParticipant._id.toString(),
            name: otherParticipant.name,
            email: otherParticipant.email,
          } : null,
          lastMessage,
          lastActivity: conv.lastActivity,
          unreadCount,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json({
      conversations: transformedConversations,
      total: transformedConversations.length,
    });

  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation
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
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    // Check if conversation already exists between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [userAuth.userId, recipientId], $size: 2 }
    }).populate('participants', 'name email');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userAuth.userId, recipientId],
      });
      await conversation.save();
      await conversation.populate('participants', 'name email');
    }

    const otherParticipant = conversation.participants.find(
      (p: any) => p._id.toString() !== userAuth.userId
    );

    const transformedConversation = {
      id: conversation._id.toString(),
      participants: conversation.participants.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        email: p.email,
      })),
      otherParticipant: otherParticipant ? {
        id: otherParticipant._id.toString(),
        name: otherParticipant.name,
        email: otherParticipant.email,
      } : null,
      lastMessage: null,
      lastActivity: conversation.lastActivity,
      unreadCount: 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return NextResponse.json(
      { 
        message: 'Conversation ready', 
        conversation: transformedConversation 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}