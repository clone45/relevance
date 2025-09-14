import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get current user's existing friendships (all statuses)
    const existingFriendships = await Friendship.find({
      $or: [
        { requester: userAuth.userId },
        { recipient: userAuth.userId }
      ]
    });

    const connectedUserIds = existingFriendships.map(friendship => {
      return friendship.requester.toString() === userAuth.userId
        ? friendship.recipient.toString()
        : friendship.requester.toString();
    });

    // Exclude self and existing connections
    const excludeIds = [...connectedUserIds, userAuth.userId];

    // Strategy 1: Find users in the same groups (mutual groups)
    const userGroups = await GroupMember.find({
      userId: userAuth.userId,
      status: 'active'
    });
    const userGroupIds = userGroups.map(gm => gm.groupId);

    const mutualGroupMembers = await GroupMember.find({
      groupId: { $in: userGroupIds },
      userId: { $nin: excludeIds },
      status: 'active'
    })
      .populate('userId', 'name email')
      .limit(limit);

    // Get unique users from mutual groups
    const mutualGroupUsers = mutualGroupMembers.reduce((acc, member) => {
      const userId = member.userId._id.toString();
      if (!acc.find((u: any) => u.id === userId)) {
        acc.push({
          id: userId,
          name: member.userId.name,
          email: member.userId.email,
          reason: 'mutual_groups',
        });
      }
      return acc;
    }, [] as Array<{ id: string; name: string; email: string; reason: string }>);

    // Strategy 2: Friends of friends (second-degree connections)
    const acceptedFriendships = existingFriendships.filter(f => f.status === 'accepted');
    const friendIds = acceptedFriendships.map(friendship => {
      return friendship.requester.toString() === userAuth.userId
        ? friendship.recipient.toString()
        : friendship.requester.toString();
    });

    let friendsOfFriends: Array<{ id: string; name: string; email: string; reason: string }> = [];
    
    if (friendIds.length > 0) {
      const friendsOfFriendsFriendships = await Friendship.find({
        $or: [
          { requester: { $in: friendIds } },
          { recipient: { $in: friendIds } }
        ],
        status: 'accepted'
      })
        .populate('requester', 'name email')
        .populate('recipient', 'name email');

      friendsOfFriends = friendsOfFriendsFriendships.reduce((acc, friendship) => {
        const friendOfFriendId = friendIds.includes(friendship.requester._id.toString())
          ? friendship.recipient._id.toString()
          : friendship.requester._id.toString();

        if (!excludeIds.includes(friendOfFriendId) && !acc.find((u: any) => u.id === friendOfFriendId)) {
          const user = friendIds.includes(friendship.requester._id.toString())
            ? friendship.recipient
            : friendship.requester;

          acc.push({
            id: friendOfFriendId,
            name: user.name,
            email: user.email,
            reason: 'friends_of_friends',
          });
        }
        return acc;
      }, [] as Array<{ id: string; name: string; email: string; reason: string }>);
    }

    // Strategy 3: Recently joined users (if we don't have enough suggestions)
    const currentSuggestions = [...mutualGroupUsers, ...friendsOfFriends];
    let recentUsers: Array<{ id: string; name: string; email: string; reason: string }> = [];
    
    if (currentSuggestions.length < limit) {
      const recentUsersQuery = await User.find({
        _id: { 
          $nin: [
            ...excludeIds, 
            ...currentSuggestions.map(u => u.id)
          ] 
        }
      })
        .select('name email')
        .sort({ createdAt: -1 })
        .limit(limit - currentSuggestions.length);

      recentUsers = recentUsersQuery.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        reason: 'new_users',
      }));
    }

    // Combine all suggestions and limit
    const allSuggestions = [
      ...mutualGroupUsers,
      ...friendsOfFriends,
      ...recentUsers
    ].slice(0, limit);

    // Transform suggestions with reason labels
    const transformedSuggestions = allSuggestions.map(suggestion => ({
      id: suggestion.id,
      name: suggestion.name,
      email: suggestion.email,
      reason: suggestion.reason,
      reasonLabel: getReasonLabel(suggestion.reason),
    }));

    return NextResponse.json({
      suggestions: transformedSuggestions,
      total: transformedSuggestions.length,
    });

  } catch (error: unknown) {
    console.error('Get friend suggestions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getReasonLabel(reason: string): string {
  switch (reason) {
    case 'mutual_groups':
      return 'In your groups';
    case 'friends_of_friends':
      return 'Friend of a friend';
    case 'new_users':
      return 'New to the platform';
    default:
      return 'Suggested for you';
  }
}