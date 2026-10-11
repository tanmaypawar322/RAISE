import mongoose, { Schema, Document } from 'mongoose';

export type DonationType = 'one_time' | 'recurring';
export type DonationStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface IDonationDeclarations {
  notPoliticalEntity: boolean;
  notForeign: boolean;
}

export interface IDonation extends Document {
  donorUserId?: mongoose.Types.ObjectId;
  donorName?: string;
  donorEmail: string;
  amountPaise: number;
  currency: 'INR';
  type: DonationType;
  status: DonationStatus;
  fund: 'general';
  anonymous: boolean;
  showOnSupportersList: boolean;
  provider: 'razorpay' | 'mock';
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  receiptNumber?: string;
  receipt80G: boolean;
  panEnc?: string; // AES-256-GCM encrypted PAN
  panMasked?: string;
  declarations: IDonationDeclarations;
  refundReason?: string;
  refundedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    donorName: {
      type: String,
      trim: true,
    },
    donorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1000, // ₹10 minimum
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    type: {
      type: String,
      enum: ['one_time', 'recurring'],
      default: 'one_time',
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    fund: {
      type: String,
      default: 'general',
      required: true,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    showOnSupportersList: {
      type: Boolean,
      default: false,
      index: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'mock'],
      default: 'mock',
    },
    providerOrderId: {
      type: String,
      index: true,
    },
    providerPaymentId: {
      type: String,
      index: true,
    },
    providerSubscriptionId: {
      type: String,
      index: true,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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
    declarations: {
      notPoliticalEntity: { type: Boolean, required: true },
      notForeign: { type: Boolean, required: true },
    },
    refundReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

DonationSchema.index({ createdAt: -1 });

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);
