import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeClaim extends Document {
  userId: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  role: 'official' | 'agency';
  accountType: 'department_official' | 'agency_contractor' | 'representative' | 'representative_staff';
  representativeRole?: string;
  jurisdictionId?: mongoose.Types.ObjectId;
  representativeProfileId?: mongoose.Types.ObjectId;
  termStart?: Date;
  termEnd?: Date;
  officialSiteUrl?: string;
  isStaff?: boolean;
  conflictFlag?: boolean;
  conflictDetails?: string;
  designation: string;
  employeeId?: string;
  workEmail: string;
  documentUrl?: string;
  documentFilename?: string;
  claimNotes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfficeClaimSchema = new Schema<IOfficeClaim>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', index: true },
    role: { type: String, enum: ['official', 'agency'], required: true, default: 'official' },
    accountType: {
      type: String,
      enum: ['department_official', 'agency_contractor', 'representative', 'representative_staff'],
      default: 'department_official',
      index: true,
    },
    representativeRole: { type: String },
    jurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction', index: true },
    representativeProfileId: { type: Schema.Types.ObjectId, ref: 'RepresentativeProfile', index: true },
    termStart: { type: Date },
    termEnd: { type: Date },
    officialSiteUrl: { type: String },
    isStaff: { type: Boolean, default: false },
    conflictFlag: { type: Boolean, default: false },
    conflictDetails: { type: String },
    designation: { type: String, required: true, trim: true },
    employeeId: { type: String, trim: true },
    workEmail: { type: String, required: true, trim: true, lowercase: true },
    documentUrl: { type: String },
    documentFilename: { type: String },
    claimNotes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_info'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    adminNotes: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const OfficeClaim = mongoose.model<IOfficeClaim>('OfficeClaim', OfficeClaimSchema);
