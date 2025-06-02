import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['missed', 'accepted', 'rejected', 'ended'],
      default: 'missed',
    },
    duration: {
      type: Number,
      default: 0, // Duration in seconds
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Add index for querying call history by user
callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });

const Call = mongoose.model('Call', callSchema);

export default Call;
