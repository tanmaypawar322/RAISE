import mongoose, { Schema, Document } from 'mongoose';

export type CorrectionTargetType = 'office' | 'representative';
export type CorrectionStatus = 'pending' | 'under_review' | 'resolved' | 'rejected';

export interface ICorrectionRequest extends Document {
  targetType: CorrectionTargetType;
  targetId: mongoose.Types.ObjectId;
  itemOrMetric: string;
  explanation: string;
  contactEmail: string;
  evidenceFileIds?: string[];
  status: CorrectionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminNotes?: string;
  outcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CorrectionRequestSchema = new Schema<ICorrectionRequest>(
  {
    targetType: {
      type: String,
      enum: ['office', 'representative'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    itemOrMetric: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    evidenceFileIds: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
    },
    outcome: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const CorrectionRequest = mongoose.model<ICorrectionRequest>(
  'CorrectionRequest',
  CorrectionRequestSchema
);
