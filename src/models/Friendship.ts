import mongoose, { Document, Schema } from 'mongoose';

export interface IFriendship extends Document {
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Indexes for performance
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendshipSchema.index({ requester: 1, status: 1 });
FriendshipSchema.index({ recipient: 1, status: 1 });
FriendshipSchema.index({ status: 1 });

// Prevent users from friending themselves
FriendshipSchema.pre('save', function(next) {
  if (this.requester.toString() === this.recipient.toString()) {
    return next(new Error('Cannot create friendship with yourself'));
  }
  next();
});

export default mongoose.models.Friendship || mongoose.model<IFriendship>('Friendship', FriendshipSchema);