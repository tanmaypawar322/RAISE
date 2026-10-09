import mongoose, { Schema, Document } from 'mongoose';

export type JurisdictionType = 'ward' | 'prabhag' | 'zone' | 'hq';

export interface IJurisdiction extends Document {
  name: string;
  nameMr?: string;
  nameHi?: string;
  code?: string;
  type: JurisdictionType;
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  parentJurisdictionId?: mongoose.Types.ObjectId;
  slaHoursDefault: number;
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
    code: { type: String, trim: true },
    type: {
      type: String,
      enum: ['ward', 'prabhag', 'zone', 'hq'],
      required: true,
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
    active: { type: Boolean, default: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// 2dsphere index on boundary for geospatial containment searches ($geoIntersects)
JurisdictionSchema.index({ boundary: '2dsphere' });

export const Jurisdiction = mongoose.model<IJurisdiction>('Jurisdiction', JurisdictionSchema);
