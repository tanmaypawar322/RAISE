import mongoose, { Schema, Document } from 'mongoose';

export type OutreachStatus =
  | 'not_contacted'
  | 'contacted'
  | 'interested'
  | 'joined'
  | 'declined';

export interface IOutreachRecord extends Document {
  targetType: 'office' | 'representative';
  targetId: mongoose.Types.ObjectId;
  status: OutreachStatus;
  lastContactedAt?: Date;
  notes?: string;
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OutreachRecordSchema = new Schema<IOutreachRecord>(
  {
    targetType: {
      type: String,
      enum: ['office', 'representative'],
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    status: {
      type: String,
      enum: ['not_contacted', 'contacted', 'interested', 'joined', 'declined'],
      default: 'not_contacted',
      index: true,
    },
    lastContactedAt: { type: Date },
    notes: { type: String, trim: true },
    owner: { type: String, trim: true },
  },
  { timestamps: true }
);

OutreachRecordSchema.index({ targetType: 1, targetId: 1 }, { unique: true });
OutreachRecordSchema.index({ status: 1, lastContactedAt: -1 });

export const OutreachRecord = mongoose.model<IOutreachRecord>('OutreachRecord', OutreachRecordSchema);
