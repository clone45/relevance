import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Post from '@/models/Post';
import { authenticateUser } from '@/middleware/auth';

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const comments = await Comment.find({ 
      postId: (await params).id,
      parentCommentId: null,
    })
      .populate('author', 'name email')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ 
      postId: (await params).id,
      parentCommentId: null,
    });

    // Transform comments
    const transformedComments = comments.map(comment => ({
      id: comment._id.toString(),
      content: comment.content,
      author: {
        id: comment.author._id.toString(),
        name: comment.author.name,
        email: comment.author.email,
      },
      postId: comment.postId.toString(),
      parentCommentId: comment.parentCommentId?.toString() || null,
      likes: comment.likes.map((id: any) => id.toString()),
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
    }));

    return NextResponse.json({
      comments: transformedComments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: unknown) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - Create a new comment
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
    
    const body = await request.json();
    const { content, parentCommentId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await Post.findById((await params).id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // If it's a reply, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.postId.toString() !== (await params).id) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const comment = new Comment({
      content: content.trim(),
      author: userAuth.userId,
      postId: (await params).id,
      parentCommentId: parentCommentId || null,
    });

    await comment.save();

    // Update post comment count
    await Post.findByIdAndUpdate((await params).id, {
      $inc: { commentCount: 1 }
    });

    // Populate the comment with author info
    await comment.populate('author', 'name email');

    const transformedComment = {
      id: comment._id.toString(),
      content: comment.content,
      author: {
        id: comment.author._id.toString(),
        name: comment.author.name,
        email: comment.author.email,
      },
      postId: comment.postId.toString(),
      parentCommentId: comment.parentCommentId?.toString() || null,
      likes: comment.likes.map((id: any) => id.toString()),
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
    };

    return NextResponse.json(
      { message: 'Comment created successfully', comment: transformedComment },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Create comment error:', error);
    
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