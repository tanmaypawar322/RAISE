import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanLimits {
  seats: number; // e.g. 5 for basic, 25 for pro, 100 for enterprise
  exportsPerMonth: number;
  notificationCredits: number;
}

export interface IPlan extends Document {
  key: string; // 'citizen' | 'office_basic' | 'office_pro' | 'agency' | 'institution'
  name: string;
  nameMr?: string;
  nameHi?: string;
  description: string;
  descriptionMr?: string;
  descriptionHi?: string;
  priceMonthlyPaise: number;
  priceYearlyPaise: number;
  features: string[]; // e.g. ['public_reporting', 'team_seats', 'sla_automation', 'analytics_dashboard', 'bulk_export', 'work_orders', 'trend_reports', 'api_access']
  limits: IPlanLimits;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true },
    nameMr: { type: String },
    nameHi: { type: String },
    description: { type: String, required: true },
    descriptionMr: { type: String },
    descriptionHi: { type: String },
    priceMonthlyPaise: { type: Number, required: true, default: 0 },
    priceYearlyPaise: { type: Number, required: true, default: 0 },
    features: [{ type: String }],
    limits: {
      seats: { type: Number, default: 3 },
      exportsPerMonth: { type: Number, default: 10 },
      notificationCredits: { type: Number, default: 100 },
    },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
