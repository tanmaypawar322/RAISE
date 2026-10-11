import mongoose, { Schema, Document } from 'mongoose';

export type RepAskStatus = 'pending' | 'acknowledged' | 'taken_up' | 'declined';

export interface IRepresentativeAsk extends Document {
  issueId: mongoose.Types.ObjectId;
  representativeProfileId: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  status: RepAskStatus;
  declinedReason?: string;
  acknowledgedAt?: Date;
  takenUpAt?: Date;
  slaDeadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RepresentativeAskSchema = new Schema<IRepresentativeAsk>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    representativeProfileId: { type: Schema.Types.ObjectId, ref: 'RepresentativeProfile', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'taken_up', 'declined'],
      default: 'pending',
      index: true,
    },
    declinedReason: { type: String, trim: true },
    acknowledgedAt: { type: Date },
    takenUpAt: { type: Date },
    slaDeadline: { type: Date, required: true },
  },
  { timestamps: true }
);

// One ask per citizen per representative role per issue
RepresentativeAskSchema.index({ issueId: 1, userId: 1, role: 1 }, { unique: true });

export const RepresentativeAsk = mongoose.model<IRepresentativeAsk>('RepresentativeAsk', RepresentativeAskSchema);
