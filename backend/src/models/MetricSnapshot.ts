import mongoose, { Schema, Document } from 'mongoose';

export type SnapshotTargetType = 'office' | 'representative';

export interface IMetricSnapshot extends Document {
  targetType: SnapshotTargetType;
  targetId: mongoose.Types.ObjectId;
  period: string; // 'all_time' | 'YYYY-MM'
  sampleSize: number;
  isSampleTooSmall: boolean; // sampleSize < MIN_SAMPLE_FOR_SCORECARD (10)
  metrics: {
    // Office metrics:
    issuesReceived?: number;
    acknowledgedWithinSlaPct?: number | null;
    resolvedWithinSlaPct?: number | null;
    citizenConfirmedPct?: number | null;
    disputedPct?: number | null;
    medianResolutionHours?: number | null;
    reopenedCount?: number;

    // Representative metrics:
    asksReceived?: number;
    responseRatePct?: number | null; // answered/taken up within 72h
    issuesTakenUp?: number;
    confirmedResolutions?: number; // taken up by rep, resolved by dept, citizen confirmed
    citizenThanksCount?: number;
  };
  computedAt: Date;
  computedAtFormatted: string;
  createdAt: Date;
  updatedAt: Date;
}

const MetricSnapshotSchema = new Schema<IMetricSnapshot>(
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
    period: {
      type: String,
      default: 'all_time',
      index: true,
    },
    sampleSize: {
      type: Number,
      default: 0,
    },
    isSampleTooSmall: {
      type: Boolean,
      default: true,
    },
    metrics: {
      issuesReceived: { type: Number, default: 0 },
      acknowledgedWithinSlaPct: { type: Number, default: null },
      resolvedWithinSlaPct: { type: Number, default: null },
      citizenConfirmedPct: { type: Number, default: null },
      disputedPct: { type: Number, default: null },
      medianResolutionHours: { type: Number, default: null },
      reopenedCount: { type: Number, default: 0 },

      asksReceived: { type: Number, default: 0 },
      responseRatePct: { type: Number, default: null },
      issuesTakenUp: { type: Number, default: 0 },
      confirmedResolutions: { type: Number, default: 0 },
      citizenThanksCount: { type: Number, default: 0 },
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
    computedAtFormatted: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MetricSnapshotSchema.index({ targetType: 1, targetId: 1, period: 1 }, { unique: true });

export const MetricSnapshot = mongoose.model<IMetricSnapshot>(
  'MetricSnapshot',
  MetricSnapshotSchema
);
