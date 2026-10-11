import mongoose, { Schema, Document } from 'mongoose';

export type RepUpdateStatus = 'pending_moderation' | 'published' | 'rejected';

export interface IRepresentativeUpdate extends Document {
  representativeProfileId: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  category: string;
  jurisdictionId?: mongoose.Types.ObjectId;
  photos: string[];
  externalUrl?: string;
  status: RepUpdateStatus;
  moderationReason?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  confirmedUserIds: mongoose.Types.ObjectId[];
  confirmedCount: number;
  disputedUserIds: mongoose.Types.ObjectId[];
  disputeReasons: Array<{
    userId: mongoose.Types.ObjectId;
    reason: string;
    createdAt: Date;
  }>;
  disputedCount: number;
  isUnderCommunityReview?: boolean;
  isSelfReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RepresentativeUpdateSchema = new Schema<IRepresentativeUpdate>(
  {
    representativeProfileId: { type: Schema.Types.ObjectId, ref: 'RepresentativeProfile', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 2500 },
    category: { type: String, required: true, trim: true, default: 'general' },
    jurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction', index: true },
    photos: { type: [String], default: [] },
    externalUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending_moderation', 'published', 'rejected'],
      default: 'pending_moderation',
      index: true,
    },
    moderationReason: { type: String, trim: true },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    confirmedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    confirmedCount: { type: Number, default: 0 },
    disputedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    disputeReasons: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    disputedCount: { type: Number, default: 0 },
    isUnderCommunityReview: { type: Boolean, default: false, index: true },
    isSelfReported: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const RepresentativeUpdate = mongoose.model<IRepresentativeUpdate>('RepresentativeUpdate', RepresentativeUpdateSchema);
