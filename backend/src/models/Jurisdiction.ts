import mongoose, { Schema, Document } from 'mongoose';

export type JurisdictionType =
  | 'ward'
  | 'prabhag'
  | 'zone'
  | 'hq'
  | 'gram_panchayat'
  | 'corporation'
  | 'district'
  | 'assembly_constituency'
  | 'parliamentary_constituency'
  | 'state'
  | 'centre';

export type JurisdictionLevel =
  | 'ward'
  | 'gram_panchayat'
  | 'zone'
  | 'corporation'
  | 'district'
  | 'assembly_constituency'
  | 'parliamentary_constituency'
  | 'state'
  | 'centre';

export interface IJurisdiction extends Document {
  name: string;
  nameMr?: string;
  nameHi?: string;
  code?: string;
  type: JurisdictionType;
  level?: JurisdictionLevel;
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  parentJurisdictionId?: mongoose.Types.ObjectId;
  slaHoursDefault: number;
  settlementType?: 'rural_panchayat' | 'urban_municipal';
  verificationThreshold?: number; // 5 for rural Gram Panchayat, 25 for urban
  ruralMetadata?: {
    taluka?: string;
    district?: string;
    villageCensusCode?: string;
    estimatedPopulation?: number;
  };
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const JurisdictionSchema = new Schema<IJurisdiction>(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameMr: { type: String, trim: true },
    nameHi: { type: String, trim: true },
    code: { type: String, trim: true, index: true },
    type: {
      type: String,
      enum: [
        'ward',
        'prabhag',
        'zone',
        'hq',
        'gram_panchayat',
        'corporation',
        'district',
        'assembly_constituency',
        'parliamentary_constituency',
        'state',
        'centre',
      ],
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: [
        'ward',
        'gram_panchayat',
        'zone',
        'corporation',
        'district',
        'assembly_constituency',
        'parliamentary_constituency',
        'state',
        'centre',
      ],
      index: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true,
      },
      coordinates: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    parentJurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction' },
    slaHoursDefault: { type: Number, default: 48 },
    settlementType: {
      type: String,
      enum: ['rural_panchayat', 'urban_municipal'],
      default: 'urban_municipal',
      index: true,
    },
    verificationThreshold: { type: Number, default: 25 },
    ruralMetadata: {
      taluka: { type: String, trim: true },
      district: { type: String, trim: true },
      villageCensusCode: { type: String, trim: true },
      estimatedPopulation: { type: Number },
    },
    active: { type: Boolean, default: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// 2dsphere index on boundary for geospatial containment searches ($geoIntersects)
JurisdictionSchema.index({ boundary: '2dsphere' });

export const Jurisdiction = mongoose.model<IJurisdiction>('Jurisdiction', JurisdictionSchema);
