import mongoose, { Schema, Document } from 'mongoose';

export type ModerationReason =
  | 'spam'
  | 'hate_speech'
  | 'fake_media'
  | 'doxxing'
  | 'violence'
  | 'not_a_civic_issue'
  | 'personal_info'
  | 'other';

export interface IModerationReport extends Document {
  targetType: 'issue' | 'official_reply' | 'comment';
  targetId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason: ModerationReason;
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  reviewerId?: mongoose.Types.ObjectId;
  reviewerNotes?: string;
  actionTaken?: 'dismiss' | 'redact_pii' | 'hide' | 'remove';
  createdAt: Date;
  updatedAt: Date;
}

const ModerationReportSchema = new Schema<IModerationReport>(
  {
    targetType: {
      type: String,
      enum: ['issue', 'official_reply', 'comment'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: [
        'spam',
        'hate_speech',
        'fake_media',
        'doxxing',
        'violence',
        'not_a_civic_issue',
        'personal_info',
        'other',
      ],
      required: true,
    },
    details: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewerNotes: { type: String, maxlength: 500 },
    actionTaken: {
      type: String,
      enum: ['dismiss', 'redact_pii', 'hide', 'remove'],
    },
  },
  { timestamps: true }
);

// One report per citizen per target item
ModerationReportSchema.index({ reportedBy: 1, targetId: 1, targetType: 1 }, { unique: true });

export const ModerationReport = mongoose.model<IModerationReport>(
  'ModerationReport',
  ModerationReportSchema
);

