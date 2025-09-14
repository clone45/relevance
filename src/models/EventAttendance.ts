import mongoose, { Document, Schema } from 'mongoose';

export interface IEventAttendance extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'going' | 'maybe' | 'not_going';
  createdAt: Date;
  updatedAt: Date;
}

const EventAttendanceSchema = new Schema<IEventAttendance>({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['going', 'maybe', 'not_going'],
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one attendance record per user per event
EventAttendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventAttendanceSchema.index({ userId: 1 });
EventAttendanceSchema.index({ eventId: 1, status: 1 });

export default mongoose.models.EventAttendance || mongoose.model<IEventAttendance>('EventAttendance', EventAttendanceSchema);