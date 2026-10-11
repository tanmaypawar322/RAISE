import mongoose, { Schema, Document } from 'mongoose';

export type MilestoneVoteType = 'verify' | 'dispute';

export interface IMilestoneVote extends Document {
  milestoneId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  vote: MilestoneVoteType;
  disputeReason?: string;
  verifiedResident: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneVoteSchema = new Schema<IMilestoneVote>(
  {
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'RepresentativeMilestone',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vote: {
      type: String,
      enum: ['verify', 'dispute'],
      required: true,
    },
    disputeReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    verifiedResident: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One vote per citizen per milestone
MilestoneVoteSchema.index({ milestoneId: 1, userId: 1 }, { unique: true });

export const MilestoneVote = mongoose.model<IMilestoneVote>('MilestoneVote', MilestoneVoteSchema);
