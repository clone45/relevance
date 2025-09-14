import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  coverImage?: string;
  rules?: string;
  location?: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Group description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: String,
    required: [true, 'Group category is required'],
    enum: ['technology', 'sports', 'hobbies', 'education', 'business', 'social', 'health', 'arts', 'other'],
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  coverImage: {
    type: String,
    default: null,
  },
  rules: {
    type: String,
    maxlength: [1000, 'Rules cannot exceed 1000 characters'],
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  memberCount: {
    type: Number,
    default: 1,
    min: 0,
  },
}, {
  timestamps: true,
});

GroupSchema.index({ name: 'text', description: 'text', tags: 'text' });
GroupSchema.index({ category: 1 });
GroupSchema.index({ isPrivate: 1 });
GroupSchema.index({ createdBy: 1 });

export default mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);