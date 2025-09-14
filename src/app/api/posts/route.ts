import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import GroupMembership from '@/models/GroupMembership';
import { authenticateUser } from '@/middleware/auth';

// GET /api/posts - Get posts (for feed or group posts)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = {};
    
    if (groupId) {
      query.groupId = groupId;
    } else {
      // For feed, only show posts from groups the user is a member of
      const userAuth = authenticateUser(request);
      if (!userAuth) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Get user's group memberships
      const memberships = await GroupMembership.find({
        userId: userAuth.userId,
        isActive: true,
      }).select('groupId');

      const groupIds = memberships.map(m => m.groupId);
      if (groupIds.length === 0) {
        return NextResponse.json({
          posts: [],
          total: 0,
          page,
          totalPages: 0,
        });
      }

      query.groupId = { $in: groupIds };
    }

    const posts = await Post.find(query)
      .populate('author', 'name email')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    // Transform the response to match our frontend types
    const transformedPosts = posts.map(post => ({
      id: post._id.toString(),
      content: post.content,
      author: {
        id: post.author._id.toString(),
        name: post.author.name,
        email: post.author.email,
      },
      groupId: post.groupId._id.toString(),
      group: {
        id: post.groupId._id.toString(),
        name: post.groupId.name,
      },
      likes: post.likes.map(id => id.toString()),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited,
    }));

    return NextResponse.json({
      posts: transformedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
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
    const { content, groupId } = body;

    if (!content || !groupId) {
      return NextResponse.json(
        { error: 'Content and groupId are required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const membership = await GroupMembership.findOne({
      groupId,
      userId: userAuth.userId,
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to post' },
        { status: 403 }
      );
    }

    const post = new Post({
      content: content.trim(),
      author: userAuth.userId,
      groupId,
    });

    await post.save();

    // Populate the post with author and group info
    await post.populate('author', 'name email');
    await post.populate('groupId', 'name');

    const transformedPost = {
      id: post._id.toString(),
      content: post.content,
      author: {
        id: post.author._id.toString(),
        name: post.author.name,
        email: post.author.email,
      },
      groupId: post.groupId._id.toString(),
      group: {
        id: post.groupId._id.toString(),
        name: post.groupId.name,
      },
      likes: post.likes.map(id => id.toString()),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited,
    };

    return NextResponse.json(
      { message: 'Post created successfully', post: transformedPost },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create post error:', error);
    
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