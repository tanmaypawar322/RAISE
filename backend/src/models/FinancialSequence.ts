import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialSequence extends Document {
  prefix: string; // 'INV' | 'DON'
  financialYear: string; // e.g. '2026-27'
  lastSequence: number;
  updatedAt: Date;
}

const FinancialSequenceSchema = new Schema<IFinancialSequence>(
  {
    prefix: { type: String, required: true, uppercase: true },
    financialYear: { type: String, required: true },
    lastSequence: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

FinancialSequenceSchema.index({ prefix: 1, financialYear: 1 }, { unique: true });

export const FinancialSequence = mongoose.model<IFinancialSequence>(
  'FinancialSequence',
  FinancialSequenceSchema
);
