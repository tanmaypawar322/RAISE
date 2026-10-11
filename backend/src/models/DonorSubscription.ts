import mongoose, { Schema, Document } from 'mongoose';

export type DonorSubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface IDonorSubscription extends Document {
  donorUserId?: mongoose.Types.ObjectId;
  donorEmail: string;
  donorName?: string;
  amountPaise: number;
  status: DonorSubscriptionStatus;
  provider: 'razorpay' | 'mock';
  providerSubscriptionId: string;
  cancelToken: string;
  nextChargeAt?: Date;
  receipt80G: boolean;
  panEnc?: string;
  panMasked?: string;
  showOnSupportersList: boolean;
  declarations: {
    notPoliticalEntity: boolean;
    notForeign: boolean;
  };
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonorSubscriptionSchema = new Schema<IDonorSubscription>(
  {
    donorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    donorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    donorName: {
      type: String,
      trim: true,
    },
    amountPaise: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'past_due', 'canceled'],
      default: 'active',
      index: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'mock'],
      default: 'mock',
    },
    providerSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cancelToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nextChargeAt: {
      type: Date,
    },
    receipt80G: {
      type: Boolean,
      default: false,
    },
    panEnc: {
      type: String,
    },
    panMasked: {
      type: String,
    },
    showOnSupportersList: {
      type: Boolean,
      default: false,
    },
    declarations: {
      notPoliticalEntity: { type: Boolean, required: true },
      notForeign: { type: Boolean, required: true },
    },
    canceledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const DonorSubscription = mongoose.model<IDonorSubscription>(
  'DonorSubscription',
  DonorSubscriptionSchema
);
