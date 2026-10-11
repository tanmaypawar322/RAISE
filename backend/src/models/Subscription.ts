import mongoose, { Schema, Document } from 'mongoose';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type BillingMode = 'self_serve' | 'invoice';
export type BillingInterval = 'monthly' | 'yearly';

export interface ISubscription extends Document {
  officeId: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId;
  planKey: string;
  status: SubscriptionStatus;
  billingMode: BillingMode;
  interval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  seats: number;
  provider: 'razorpay' | 'mock' | 'manual_invoice';
  providerSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  graceUntil?: Date;
  lastPaymentError?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    officeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    planKey: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'expired'],
      default: 'active',
      index: true,
    },
    billingMode: {
      type: String,
      enum: ['self_serve', 'invoice'],
      default: 'self_serve',
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    seats: {
      type: Number,
      default: 5,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'mock', 'manual_invoice'],
      default: 'mock',
    },
    providerSubscriptionId: {
      type: String,
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    graceUntil: {
      type: Date,
    },
    lastPaymentError: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ officeId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  SubscriptionSchema
);
