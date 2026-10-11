import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeMembership {
  officeId: mongoose.Types.ObjectId;
  memberRole: 'head' | 'officer' | 'contractor' | 'staff' | 'office_admin';
  status: 'active' | 'pending' | 'revoked';
}

export interface IUser extends Document {
  name: string;
  email?: string;
  emailHash?: string;
  emailEnc?: string;
  passwordHash?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  verifiedMethods?: string[];
  needsPasswordChange?: boolean;
  phoneEnc?: string;
  phoneHash?: string;
  phoneMasked?: string;
  displayName: string;
  language: 'mr' | 'hi' | 'en';
  role: 'citizen' | 'official' | 'agency' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'deleted';
  officeMemberships: IOfficeMembership[];
  officialOfficeId?: mongoose.Types.ObjectId;
  isOfficialVerified: boolean;
  designation?: string;
  employeeId?: string;
  claimNotes?: string;
  homeWard?: string;
  homeArea?: {
    ward?: string;
    city?: string;
    district?: string;
  };
  tokenVersion: number;
  isProfileComplete: boolean;
  consentVersion?: string;
  consentAt?: Date;
  lastLoginAt?: Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorTempSecret?: string;
  twoFactorBackupCodes?: string[];
  trustScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfficeMembershipSchema = new Schema<IOfficeMembership>(
  {
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true },
    memberRole: { type: String, enum: ['head', 'officer', 'contractor', 'staff', 'office_admin'], default: 'officer' },
    status: { type: String, enum: ['active', 'pending', 'revoked'], default: 'pending' },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, default: 'Citizen' },
    email: { type: String, lowercase: true, trim: true },
    emailHash: {
      type: String,
      index: {
        unique: true,
        partialFilterExpression: { emailHash: { $type: 'string' } },
      },
    },
    emailEnc: { type: String },
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    verifiedMethods: { type: [String], default: [] },
    needsPasswordChange: { type: Boolean, default: false },
    phoneEnc: { type: String },
    phoneHash: {
      type: String,
      index: {
        unique: true,
        partialFilterExpression: { phoneHash: { $type: 'string' } },
      },
    },
    phoneMasked: { type: String },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    language: { type: String, enum: ['mr', 'hi', 'en'], default: 'mr' },
    role: { type: String, enum: ['citizen', 'official', 'agency', 'admin'], default: 'citizen', index: true },
    status: { type: String, enum: ['active', 'pending', 'suspended', 'deleted'], default: 'active', index: true },
    officeMemberships: { type: [OfficeMembershipSchema], default: [] },
    officialOfficeId: { type: Schema.Types.ObjectId, ref: 'Office' },
    isOfficialVerified: { type: Boolean, default: false },
    designation: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    claimNotes: { type: String, trim: true },
    homeWard: { type: String, trim: true },
    homeArea: {
      ward: { type: String, default: 'Ward 12' },
      city: { type: String, default: 'Pimpri-Chinchwad' },
      district: { type: String, default: 'Pune' },
    },
    tokenVersion: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: false },
    consentVersion: { type: String },
    consentAt: { type: Date },
    lastLoginAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    twoFactorTempSecret: { type: String },
    twoFactorBackupCodes: { type: [String], default: [] },
    trustScore: { type: Number, default: 1.0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
