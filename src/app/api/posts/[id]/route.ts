import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import { authenticateUser } from '@/middleware/auth';

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const post = await Post.findById((await params).id)
      .populate('author', 'name email')
      .populate('groupId', 'name');

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

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
      likes: post.likes.map((id: any) => id.toString()),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited,
    };

    return NextResponse.json({ post: transformedPost });

  } catch (error: unknown) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update post (author only)
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
    
    const post = await Post.findById((await params).id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.author.toString() !== userAuth.userId) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    post.content = content.trim();
    post.isEdited = true;
    await post.save();

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
      likes: post.likes.map((id: any) => id.toString()),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited,
    };

    return NextResponse.json({
      message: 'Post updated successfully',
      post: transformedPost,
    });

  } catch (error: unknown) {
    console.error('Update post error:', error);
    
    if (error && typeof error === 'object' && 'errors' in error && error.errors) {
      const validationErrors = Object.values(error.errors as Record<string, { message: string }>).map((err) => err.message);
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

// DELETE /api/posts/[id] - Delete post (author only)
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
    
    const post = await Post.findById((await params).id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.author.toString() !== userAuth.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    await Post.findByIdAndDelete((await params).id);

    return NextResponse.json({
      message: 'Post deleted successfully',
    });

  } catch (error: unknown) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}