import mongoose, { Schema, Document } from 'mongoose';

export type DirectiveStatus = 'active' | 'complied' | 'breached';

export interface IEscalationDirective extends Document {
  issueId: mongoose.Types.ObjectId;
  issuerUserId: mongoose.Types.ObjectId;
  issuerRole: 'admin' | 'official';
  issuerOfficeId?: mongoose.Types.ObjectId;
  issuerTitle?: string; // e.g. "District Collector, Pune" or "CEO Zilla Parishad"
  directiveText: string;
  deadlineHours: number;
  deadlineAt: Date;
  targetOfficeId: mongoose.Types.ObjectId;
  targetUserId?: mongoose.Types.ObjectId;
  reassignedAgencyId?: mongoose.Types.ObjectId;
  status: DirectiveStatus;
  compliedAt?: Date;
  complianceProof?: {
    note?: string;
    photoUrls?: string[];
    verifiedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EscalationDirectiveSchema = new Schema<IEscalationDirective>(
  {
    issueId: {
      type: Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    issuerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issuerRole: {
      type: String,
      enum: ['admin', 'official'],
      required: true,
    },
    issuerOfficeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
    },
    issuerTitle: {
      type: String,
      trim: true,
    },
    directiveText: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    deadlineHours: {
      type: Number,
      required: true,
      default: 48,
    },
    deadlineAt: {
      type: Date,
      required: true,
      index: true,
    },
    targetOfficeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: true,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reassignedAgencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
    },
    status: {
      type: String,
      enum: ['active', 'complied', 'breached'],
      default: 'active',
      index: true,
    },
    compliedAt: {
      type: Date,
    },
    complianceProof: {
      note: { type: String, trim: true },
      photoUrls: [{ type: String }],
      verifiedAt: { type: Date },
    },
  },
  { timestamps: true }
);

EscalationDirectiveSchema.index({ targetOfficeId: 1, status: 1 });
EscalationDirectiveSchema.index({ deadlineAt: 1, status: 1 });

export const EscalationDirective = mongoose.model<IEscalationDirective>(
  'EscalationDirective',
  EscalationDirectiveSchema
);
