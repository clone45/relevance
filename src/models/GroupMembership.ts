import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMembership extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

const GroupMembershipSchema = new Schema<IGroupMembership>({
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
    enum: ['owner', 'admin', 'moderator', 'member'],
    default: 'member',
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

// Compound index to ensure one membership per user per group
GroupMembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupMembershipSchema.index({ userId: 1 });
GroupMembershipSchema.index({ groupId: 1, role: 1 });

export default mongoose.models.GroupMembership || mongoose.model<IGroupMembership>('GroupMembership', GroupMembershipSchema);