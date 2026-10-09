import mongoose, { Schema, Document } from 'mongoose';

export interface IRaise extends Document {
  userId: mongoose.Types.ObjectId;
  issueId: mongoose.Types.ObjectId;
  weight: number;
  createdAt: Date;
}

const RaiseSchema = new Schema<IRaise>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    weight: { type: Number, default: 1.0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One person, one raise per issue constraint
RaiseSchema.index({ userId: 1, issueId: 1 }, { unique: true });

export const Raise = mongoose.model<IRaise>('Raise', RaiseSchema);
