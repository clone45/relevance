import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PersonalPost from '@/models/PersonalPost';
import { authenticateUser } from '@/middleware/auth';

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
    
    const post = await PersonalPost.findById(params.id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const userId = userAuth.userId;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(like => like.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return NextResponse.json({
      message: hasLiked ? 'Post unliked' : 'Post liked',
      liked: !hasLiked,
      likeCount: post.likeCount,
    });

  } catch (error: any) {
    console.error('Like personal post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}