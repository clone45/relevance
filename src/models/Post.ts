import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

const PostSchema = new Schema<IPost>({
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
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
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
PostSchema.index({ groupId: 1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ content: 'text' });

// Update likeCount when likes array changes
PostSchema.pre('save', function(next) {
  if (this.isModified('likes')) {
    this.likeCount = this.likes.length;
  }
  next();
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);