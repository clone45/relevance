import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMembership from '@/models/GroupMembership';
import { authenticateUser } from '@/middleware/auth';

// GET /api/groups/[id] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const group = await Group.findById(params.id)
      .populate('createdBy', 'name email');

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if group is private and user has access
    const userAuth = authenticateUser(request);
    if (group.isPrivate && !userAuth) {
      return NextResponse.json(
        { error: 'This group is private' },
        { status: 403 }
      );
    }

    // If user is authenticated, check membership status
    let userMembership = null;
    if (userAuth) {
      userMembership = await GroupMembership.findOne({
        groupId: params.id,
        userId: userAuth.userId,
        isActive: true,
      });

      // If private group and user is not a member
      if (group.isPrivate && !userMembership) {
        return NextResponse.json(
          { error: 'You do not have access to this group' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      group,
      userMembership: userMembership ? {
        role: userMembership.role,
        joinedAt: userMembership.joinedAt,
      } : null,
    });

  } catch (error: any) {
    console.error('Get group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[id] - Update group (admin/owner only)
export async function PUT(
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
    
    // Check if user has permission to update group
    const membership = await GroupMembership.findOne({
      groupId: params.id,
      userId: userAuth.userId,
      role: { $in: ['owner', 'admin'] },
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have permission to update this group' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, category, isPrivate, location, tags, rules } = body;

    const group = await Group.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(typeof isPrivate === 'boolean' && { isPrivate }),
        ...(location !== undefined && { location }),
        ...(tags && { tags }),
        ...(rules !== undefined && { rules }),
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Group updated successfully',
      group,
    });

  } catch (error: any) {
    console.error('Update group error:', error);
    
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

// DELETE /api/groups/[id] - Delete group (owner only)
export async function DELETE(
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
    
    // Check if user is the owner
    const membership = await GroupMembership.findOne({
      groupId: params.id,
      userId: userAuth.userId,
      role: 'owner',
      isActive: true,
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Only the group owner can delete the group' },
        { status: 403 }
      );
    }

    // Delete all memberships first
    await GroupMembership.deleteMany({ groupId: params.id });
    
    // Delete the group
    const group = await Group.findByIdAndDelete(params.id);

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Group deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}