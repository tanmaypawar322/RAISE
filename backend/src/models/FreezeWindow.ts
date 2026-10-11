import mongoose, { Schema, Document } from 'mongoose';

export interface IFreezeWindow extends Document {
  jurisdictionId: mongoose.Types.ObjectId;
  roles: string[];
  freezeStart: Date;
  freezeEnd: Date;
  reason: string;
  createdBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FreezeWindowSchema = new Schema<IFreezeWindow>(
  {
    jurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction', required: true, index: true },
    roles: { type: [String], default: [] },
    freezeStart: { type: Date, required: true },
    freezeEnd: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const FreezeWindow = mongoose.model<IFreezeWindow>('FreezeWindow', FreezeWindowSchema);
