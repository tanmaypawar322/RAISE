import mongoose, { Schema, Document } from 'mongoose';

export type ReportTargetType = 'office' | 'representative';
export type MonthlyReportStatus = 'draft_reply_window' | 'published';

export interface IMonthlyReport extends Document {
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  period: string; // 'YYYY-MM'
  metricsSnapshot: Record<string, any>;
  draftGeneratedAt: Date;
  replyDeadline: Date;
  replyText?: string;
  replySubmittedAt?: Date;
  replySubmittedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  status: MonthlyReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyReportSchema = new Schema<IMonthlyReport>(
  {
    targetType: {
      type: String,
      enum: ['office', 'representative'],
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    period: { type: String, required: true, index: true },
    metricsSnapshot: { type: Schema.Types.Mixed, required: true },
    draftGeneratedAt: { type: Date, default: Date.now },
    replyDeadline: { type: Date, required: true },
    replyText: { type: String, trim: true, maxlength: 2000 },
    replySubmittedAt: { type: Date },
    replySubmittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    status: {
      type: String,
      enum: ['draft_reply_window', 'published'],
      default: 'draft_reply_window',
      index: true,
    },
  },
  { timestamps: true }
);

// One monthly report per target per period
MonthlyReportSchema.index({ targetType: 1, targetId: 1, period: 1 }, { unique: true });

export const MonthlyReport = mongoose.model<IMonthlyReport>('MonthlyReport', MonthlyReportSchema);
