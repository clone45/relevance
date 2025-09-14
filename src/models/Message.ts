import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  senderId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

const MessageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    minlength: [1, 'Message cannot be empty'],
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });

// Automatically mark as read by sender
MessageSchema.pre('save', function(next) {
  if (this.isNew && !this.readBy.includes(this.senderId)) {
    this.readBy.push(this.senderId);
  }
  next();
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);