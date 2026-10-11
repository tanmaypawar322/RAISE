import mongoose, { Document, Schema } from 'mongoose';

export type FinanceType = 'income' | 'expense';

export type FinanceCategory =
  | 'donations'
  | 'subscriptions'
  | 'grants'
  | 'hosting'
  | 'sms'
  | 'legal'
  | 'payroll'
  | 'audit'
  | 'other';

export interface IFinanceEntry extends Document {
  type: FinanceType;
  category: FinanceCategory;
  amountPaise: number; // Integer paise only
  date: Date;
  description: string;
  sourceName?: string; // Funder or vendor name (anonymized for individual citizens)
  isPublic: boolean;
  attachmentUrl?: string;
  financialYear: string; // e.g. "2026-27"
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceEntrySchema = new Schema<IFinanceEntry>(
  {
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'donations',
        'subscriptions',
        'grants',
        'hosting',
        'sms',
        'legal',
        'payroll',
        'audit',
        'other',
      ],
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    sourceName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
    financialYear: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

FinanceEntrySchema.index({ isPublic: 1, date: -1 });
FinanceEntrySchema.index({ financialYear: 1, type: 1 });

export const FinanceEntry = mongoose.model<IFinanceEntry>('FinanceEntry', FinanceEntrySchema);
