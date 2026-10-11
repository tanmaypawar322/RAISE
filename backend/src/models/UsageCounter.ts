import mongoose, { Schema, Document } from 'mongoose';

export type UsageKey = 'notifications' | 'exports' | 'api_calls';

export interface IUsageCounter extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  officeId: mongoose.Types.ObjectId;
  key: UsageKey;
  period: string; // e.g. '2026-06'
  used: number;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const UsageCounterSchema = new Schema<IUsageCounter>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    officeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: true,
      index: true,
    },
    key: {
      type: String,
      enum: ['notifications', 'exports', 'api_calls'],
      required: true,
    },
    period: {
      type: String,
      required: true,
    },
    used: {
      type: Number,
      required: true,
      default: 0,
    },
    limit: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

UsageCounterSchema.index({ officeId: 1, key: 1, period: 1 }, { unique: true });

export const UsageCounter = mongoose.model<IUsageCounter>(
  'UsageCounter',
  UsageCounterSchema
);
