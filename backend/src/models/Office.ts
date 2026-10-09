import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeReport {
  title: string;
  period: string;
  budget?: string;
  content: string;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IOffice extends Document {
  name: string;
  nameMr?: string;
  nameHi?: string;
  level: 'gram_panchayat' | 'ward' | 'taluka' | 'corporation' | 'district' | 'state';
  department: 'roads' | 'water' | 'sanitation' | 'health' | 'education' | 'electricity' | 'general';
  jurisdiction: {
    ward?: string;
    city: string;
    district: string;
    state: string;
    location?: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  claimStatus: 'unclaimed' | 'pending_verification' | 'claimed';
  claimedBy?: mongoose.Types.ObjectId;
  jurisdictionId?: mongoose.Types.ObjectId;
  parentOfficeId?: mongoose.Types.ObjectId;
  escalatesToOfficeId?: mongoose.Types.ObjectId;
  supportedCategories?: string[];
  slaHours?: Record<string, number> | number;
  officialEmail?: string;
  reports: IOfficeReport[];
  stats: {
    issuesTotal: number;
    issuesAcknowledged: number;
    issuesResolved: number;
    avgResponseHours: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OfficeReportSchema = new Schema<IOfficeReport>(
  {
    title: { type: String, required: true },
    period: { type: String, required: true },
    budget: { type: String },
    content: { type: String, required: true },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OfficeSchema = new Schema<IOffice>(
  {
    name: { type: String, required: true, index: true },
    nameMr: { type: String },
    nameHi: { type: String },
    level: {
      type: String,
      enum: ['gram_panchayat', 'ward', 'taluka', 'corporation', 'district', 'state'],
      required: true,
    },
    department: {
      type: String,
      enum: ['roads', 'water', 'sanitation', 'health', 'education', 'electricity', 'general'],
      required: true,
    },
    jurisdiction: {
      ward: { type: String },
      city: { type: String, default: 'Pimpri-Chinchwad' },
      district: { type: String, default: 'Pune' },
      state: { type: String, default: 'Maharashtra' },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' },
      },
    },
    claimStatus: {
      type: String,
      enum: ['unclaimed', 'pending_verification', 'claimed'],
      default: 'unclaimed',
      index: true,
    },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    jurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction', index: true },
    parentOfficeId: { type: Schema.Types.ObjectId, ref: 'Office' },
    escalatesToOfficeId: { type: Schema.Types.ObjectId, ref: 'Office' },
    supportedCategories: { type: [String], default: [] },
    slaHours: { type: Schema.Types.Mixed, default: 48 },
    officialEmail: { type: String },
    reports: [OfficeReportSchema],
    stats: {
      issuesTotal: { type: Number, default: 0 },
      issuesAcknowledged: { type: Number, default: 0 },
      issuesResolved: { type: Number, default: 0 },
      avgResponseHours: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Office = mongoose.model<IOffice>('Office', OfficeSchema);
