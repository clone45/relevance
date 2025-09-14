import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  groupId: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  attendeeCount: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Event description cannot exceed 2000 characters'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
  },
  isVirtual: {
    type: Boolean,
    default: false,
  },
  virtualLink: {
    type: String,
    trim: true,
    maxlength: [500, 'Virtual link cannot exceed 500 characters'],
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Max attendees must be at least 1'],
    max: [10000, 'Max attendees cannot exceed 10,000'],
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attendeeCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  goingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maybeCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  notGoingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Indexes for performance
EventSchema.index({ groupId: 1, startDate: 1 });
EventSchema.index({ organizer: 1, startDate: -1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ title: 'text', description: 'text' });

// Validation: End date must be after start date
EventSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  
  // If virtual, require virtual link
  if (this.isVirtual && !this.virtualLink) {
    this.invalidate('virtualLink', 'Virtual link is required for virtual events');
  }
  
  // If not virtual, require location
  if (!this.isVirtual && !this.location) {
    this.invalidate('location', 'Location is required for in-person events');
  }
  
  next();
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);