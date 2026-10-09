import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeInvite extends Document {
  token: string;
  officeId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  email?: string;
  role: 'official' | 'agency';
  memberRole: 'head' | 'officer' | 'contractor' | 'staff';
  expiresAt: Date;
  used: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfficeInviteSchema = new Schema<IOfficeInvite>(
  {
    token: { type: String, required: true, unique: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, enum: ['official', 'agency'], default: 'official', required: true },
    memberRole: {
      type: String,
      enum: ['head', 'officer', 'contractor', 'staff'],
      default: 'officer',
      required: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false, index: true },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

export const OfficeInvite = mongoose.model<IOfficeInvite>('OfficeInvite', OfficeInviteSchema);
