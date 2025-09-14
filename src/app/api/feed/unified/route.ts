import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import PersonalPost from '@/models/PersonalPost';
import Friendship from '@/models/Friendship';
import GroupMember from '@/models/GroupMember';
import { authenticateUser } from '@/middleware/auth';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get user's friends
    const friendships = await Friendship.find({
      $or: [
        { requester: userAuth.userId },
        { recipient: userAuth.userId }
      ],
      status: 'accepted'
    });

    const friendIds = friendships.map(friendship => {
      return friendship.requester.toString() === userAuth.userId
        ? friendship.recipient.toString()
        : friendship.requester.toString();
    });

    // Get user's group memberships
    const groupMemberships = await GroupMember.find({
      userId: userAuth.userId,
      status: 'active'
    });
    const groupIds = groupMemberships.map(membership => membership.groupId);

    // Fetch group posts from user's groups
    const groupPosts = await Post.find({
      group: { $in: groupIds }
    })
      .populate('author', 'name email')
      .populate('group', 'name description')
      .sort({ createdAt: -1 })
      .limit(limit * 2); // Get more to mix properly

    // Fetch personal posts from friends (including posts on user's own feed)
    const personalPosts = await PersonalPost.find({
      $or: [
        { targetUserId: userAuth.userId }, // Posts on user's feed
        { 
          targetUserId: { $in: friendIds }, // Posts on friends' feeds
          author: { $in: [...friendIds, userAuth.userId] } // Only from friends or user
        }
      ]
    })
      .populate('author', 'name email')
      .populate('targetUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 2); // Get more to mix properly

    // Transform and combine posts
    const transformedGroupPosts = groupPosts.map(post => ({
      id: post._id.toString(),
      type: 'group' as const,
      content: post.content,
      author: {
        id: post.author._id.toString(),
        name: post.author.name,
        email: post.author.email,
      },
      group: {
        id: post.group._id.toString(),
        name: post.group.name,
        description: post.group.description,
      },
      likes: post.likes.map((like: any) => like.toString()),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited,
    }));

    const transformedPersonalPosts = personalPosts.map(post => ({
      id: post._id.toString(),
      type: 'personal' as const,
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

    // Combine and sort all posts by creation date
    const allPosts = [...transformedGroupPosts, ...transformedPersonalPosts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);

    // Get total count for pagination
    const groupPostsCount = await Post.countDocuments({
      group: { $in: groupIds }
    });
    
    const personalPostsCount = await PersonalPost.countDocuments({
      $or: [
        { targetUserId: userAuth.userId },
        { 
          targetUserId: { $in: friendIds },
          author: { $in: [...friendIds, userAuth.userId] }
        }
      ]
    });

    const total = groupPostsCount + personalPostsCount;

    return NextResponse.json({
      posts: allPosts,
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
    console.error('Get unified feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}