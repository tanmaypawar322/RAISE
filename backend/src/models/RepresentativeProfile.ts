import mongoose, { Schema, Document } from 'mongoose';

export type RepresentativeRole =
  | 'ward_councillor'
  | 'sarpanch'
  | 'mla'
  | 'mlc'
  | 'mp_lok_sabha'
  | 'mp_rajya_sabha'
  | 'minister'
  | 'chief_minister'
  | 'prime_minister'
  | 'other';

export type RepresentativeStatus =
  | 'unclaimed'
  | 'pending'
  | 'verified'
  | 'term_ended'
  | 'suspended';

export interface IRepresentativeVerification {
  method?: 'document_certificate' | 'official_letter' | 'admin_verified' | 'electoral_gazette';
  evidenceFileIds?: string[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
}

export interface IRepresentativeProfile extends Document {
  officeId: mongoose.Types.ObjectId;
  role: RepresentativeRole;
  titleText: string;
  jurisdictionId: mongoose.Types.ObjectId;
  termStart: Date;
  termEnd: Date;
  status: RepresentativeStatus;
  displayName: string;
  photoUrl?: string; // admin-uploaded only
  officialSiteUrl?: string;
  verification?: IRepresentativeVerification;
  createdAt: Date;
  updatedAt: Date;
}

const RepresentativeProfileSchema = new Schema<IRepresentativeProfile>(
  {
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    role: {
      type: String,
      enum: [
        'ward_councillor',
        'sarpanch',
        'mla',
        'mlc',
        'mp_lok_sabha',
        'mp_rajya_sabha',
        'minister',
        'chief_minister',
        'prime_minister',
        'other',
      ],
      required: true,
      index: true,
    },
    titleText: { type: String, required: true, trim: true },
    jurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction', required: true, index: true },
    termStart: { type: Date, required: true },
    termEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['unclaimed', 'pending', 'verified', 'term_ended', 'suspended'],
      default: 'unclaimed',
      index: true,
    },
    displayName: { type: String, required: true, trim: true },
    photoUrl: { type: String },
    officialSiteUrl: { type: String, trim: true },
    verification: {
      method: {
        type: String,
        enum: ['document_certificate', 'official_letter', 'admin_verified', 'electoral_gazette'],
      },
      evidenceFileIds: [{ type: String }],
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

RepresentativeProfileSchema.index({ jurisdictionId: 1, role: 1, status: 1 });
RepresentativeProfileSchema.index({ termEnd: 1, status: 1 });

export const RepresentativeProfile = mongoose.model<IRepresentativeProfile>(
  'RepresentativeProfile',
  RepresentativeProfileSchema
);
