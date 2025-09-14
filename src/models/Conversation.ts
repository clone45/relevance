import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessageId?: mongoose.Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });

// Ensure exactly 2 participants for direct messages
ConversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Direct message conversations must have exactly 2 participants'));
  }
  next();
});

// Create compound index to prevent duplicate conversations between same users
ConversationSchema.index(
  { participants: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      participants: { $size: 2 } 
    }
  }
);

export default mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);