import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

const GroupMemberSchema = new Schema<IGroupMember>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique user-group combinations
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// Index for querying members by group
GroupMemberSchema.index({ groupId: 1, isActive: 1 });

// Index for querying user's groups
GroupMemberSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.GroupMember || mongoose.model<IGroupMember>('GroupMember', GroupMemberSchema);