import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import GroupMembership from '@/models/GroupMembership';
import { authenticateUser } from '@/middleware/auth';

// GET /api/groups - List groups with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Only show public groups for non-authenticated users
    const userAuth = authenticateUser(request);
    if (!userAuth) {
      query.isPrivate = false;
    }

    const groups = await Group.find(query)
      .populate('createdBy', 'name email')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Group.countDocuments(query);

    return NextResponse.json({
      groups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
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
    const { name, description, category, isPrivate, location, tags, rules } = body;

    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Name, description, and category are required' },
        { status: 400 }
      );
    }

    // Check if group name already exists
    const existingGroup = await Group.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingGroup) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 400 }
      );
    }

    const group = new Group({
      name,
      description,
      category,
      isPrivate: isPrivate || false,
      location,
      tags: tags || [],
      rules,
      createdBy: userAuth.userId,
    });

    await group.save();

    // Create owner membership
    const membership = new GroupMembership({
      groupId: group._id,
      userId: userAuth.userId,
      role: 'owner',
    });

    await membership.save();

    // Populate the group with creator info
    await group.populate('createdBy', 'name email');

    return NextResponse.json(
      { message: 'Group created successfully', group },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create group error:', error);
    
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