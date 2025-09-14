import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import { authenticateUser } from '@/middleware/auth';

// POST /api/posts/[id]/like - Like a post
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
    
    const post = await Post.findById((await params).id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const userId = userAuth.userId;
    const hasLiked = post.likes.includes(userId as any);

    if (hasLiked) {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 400 }
      );
    }

    post.likes.push(userId as any);
    await post.save();

    return NextResponse.json({
      message: 'Post liked successfully',
      likeCount: post.likeCount,
    });

  } catch (error: unknown) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id]/like - Unlike a post
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

    const userId = userAuth.userId;
    const hasLiked = post.likes.includes(userId as any);

    if (!hasLiked) {
      return NextResponse.json(
        { error: 'You have not liked this post' },
        { status: 400 }
      );
    }

    post.likes = post.likes.filter((id: any) => id.toString() !== userId);
    await post.save();

    return NextResponse.json({
      message: 'Post unliked successfully',
      likeCount: post.likeCount,
    });

  } catch (error: unknown) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}