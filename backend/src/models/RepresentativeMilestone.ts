import mongoose, { Schema, Document } from 'mongoose';

export type MilestoneCategory =
  | 'roads'
  | 'water'
  | 'sanitation'
  | 'health'
  | 'education'
  | 'electricity'
  | 'other';

export type MilestoneStatus = 'under_review' | 'active' | 'verified' | 'disputed' | 'frozen';

export interface IRepresentativeMilestone extends Document {
  representativeId: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: MilestoneCategory;
  jurisdictionId?: mongoose.Types.ObjectId;
  constituencyName: string;
  budgetPaise?: number; // Integer paise
  sanctionOrderNumber?: string;
  sanctionOrderDocUrl?: string;
  completionDate: Date;
  photos: string[];
  verificationWindowEnd: Date;
  verifiedCount: number;
  disputedCount: number;
  status: MilestoneStatus;
  isPreModerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RepresentativeMilestoneSchema = new Schema<IRepresentativeMilestone>(
  {
    representativeId: {
      type: Schema.Types.ObjectId,
      ref: 'RepresentativeProfile',
      required: true,
      index: true,
    },
    officeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },
    category: {
      type: String,
      enum: ['roads', 'water', 'sanitation', 'health', 'education', 'electricity', 'other'],
      required: true,
      index: true,
    },
    jurisdictionId: {
      type: Schema.Types.ObjectId,
      ref: 'Jurisdiction',
      index: true,
    },
    constituencyName: {
      type: String,
      required: true,
      trim: true,
    },
    budgetPaise: {
      type: Number,
      min: 0,
      default: 0,
    },
    sanctionOrderNumber: {
      type: String,
      trim: true,
    },
    sanctionOrderDocUrl: {
      type: String,
      trim: true,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    verificationWindowEnd: {
      type: Date,
      required: true,
      index: true,
    },
    verifiedCount: {
      type: Number,
      default: 0,
    },
    disputedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['under_review', 'active', 'verified', 'disputed', 'frozen'],
      default: 'active',
      index: true,
    },
    isPreModerated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

RepresentativeMilestoneSchema.index({ representativeId: 1, createdAt: -1 });
RepresentativeMilestoneSchema.index({ constituencyName: 1, category: 1 });

export const RepresentativeMilestone = mongoose.model<IRepresentativeMilestone>(
  'RepresentativeMilestone',
  RepresentativeMilestoneSchema
);
