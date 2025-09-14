import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PersonalPost from '@/models/PersonalPost';
import User from '@/models/User';
import { authenticateUser } from '@/middleware/auth';

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
    const { content, targetUserId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    const personalPost = new PersonalPost({
      content: content.trim(),
      author: userAuth.userId,
      targetUserId: targetUserId,
    });

    await personalPost.save();

    await personalPost.populate('author', 'name email');
    await personalPost.populate('targetUserId', 'name email');

    const transformedPost = {
      id: personalPost._id.toString(),
      content: personalPost.content,
      author: {
        id: personalPost.author._id.toString(),
        name: personalPost.author.name,
        email: personalPost.author.email,
      },
      targetUser: {
        id: personalPost.targetUserId._id.toString(),
        name: personalPost.targetUserId.name,
        email: personalPost.targetUserId.email,
      },
      likes: personalPost.likes.map((like: any) => like.toString()),
      likeCount: personalPost.likeCount,
      commentCount: personalPost.commentCount,
      createdAt: personalPost.createdAt,
      updatedAt: personalPost.updatedAt,
      isEdited: personalPost.isEdited,
    };

    return NextResponse.json(
      { message: 'Personal post created successfully', post: transformedPost },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Create personal post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const targetUserId = searchParams.get('targetUserId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    const posts = await PersonalPost.find({ targetUserId })
      .populate('author', 'name email')
      .populate('targetUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PersonalPost.countDocuments({ targetUserId });

    const transformedPosts = posts.map(post => ({
      id: post._id.toString(),
      content: post.content,
      author: {
        id: post.author._id.toString(),
        name: post.author.name,
        email: post.author.email,
      },
      targetUser: {
        id: post.targetUserId._id.toString(),
        name: post.targetUserId.name,
        email: post.targetUserId.email,
      },
      likes: post.likes.map((like: any) => like.toString()),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited,
    }));

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });

  } catch (error: unknown) {
    console.error('Get personal posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}