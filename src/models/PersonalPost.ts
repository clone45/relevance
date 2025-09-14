import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonalPost extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId; // The user whose profile/feed this post is on
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

const PersonalPostSchema = new Schema<IPersonalPost>({
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    minlength: [1, 'Post content cannot be empty'],
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  likeCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for performance
PersonalPostSchema.index({ targetUserId: 1, createdAt: -1 });
PersonalPostSchema.index({ author: 1, createdAt: -1 });
PersonalPostSchema.index({ createdAt: -1 });
PersonalPostSchema.index({ content: 'text' });

// Update likeCount when likes array changes
PersonalPostSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  next();
});

export default mongoose.models.PersonalPost || mongoose.model<IPersonalPost>('PersonalPost', PersonalPostSchema);