import mongoose, { Schema, Document } from 'mongoose';

export type TownhallType =
  | 'government_policy'
  | 'ward_budget'
  | 'gram_sabha_agenda'
  | 'community_topic';

export type TownhallAuthorType = 'official' | 'representative' | 'citizen';
export type TownhallStatus = 'active' | 'closed' | 'archived';

export interface ITownhallClause {
  clauseId: string;
  title: string;
  text: string;
  voteUp: number;
  voteDown: number;
}

export interface ITownhallTopic extends Document {
  title: string;
  type: TownhallType;
  authorType: TownhallAuthorType;
  authorId: mongoose.Types.ObjectId;
  officeId?: mongoose.Types.ObjectId;
  jurisdictionId?: mongoose.Types.ObjectId;
  settlementType: 'rural_panchayat' | 'urban_municipal';
  villageOrWard: string;
  summary: string;
  clauses: ITownhallClause[];
  status: TownhallStatus;
  closedAt?: Date;
  officialResponse?: {
    text: string;
    respondedAt: Date;
    respondedByOfficeId?: mongoose.Types.ObjectId;
    respondedByUserId?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TownhallClauseSchema = new Schema<ITownhallClause>(
  {
    clauseId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    voteUp: { type: Number, default: 0 },
    voteDown: { type: Number, default: 0 },
  },
  { _id: false }
);

const TownhallTopicSchema = new Schema<ITownhallTopic>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 250,
    },
    type: {
      type: String,
      enum: ['government_policy', 'ward_budget', 'gram_sabha_agenda', 'community_topic'],
      required: true,
      index: true,
    },
    authorType: {
      type: String,
      enum: ['official', 'representative', 'citizen'],
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    officeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      index: true,
    },
    jurisdictionId: {
      type: Schema.Types.ObjectId,
      ref: 'Jurisdiction',
      index: true,
    },
    settlementType: {
      type: String,
      enum: ['rural_panchayat', 'urban_municipal'],
      default: 'rural_panchayat',
      index: true,
    },
    villageOrWard: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 4000,
    },
    clauses: {
      type: [TownhallClauseSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active',
      index: true,
    },
    closedAt: {
      type: Date,
    },
    officialResponse: {
      text: { type: String, trim: true },
      respondedAt: { type: Date },
      respondedByOfficeId: { type: Schema.Types.ObjectId, ref: 'Office' },
      respondedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  {
    timestamps: true,
  }
);

TownhallTopicSchema.index({ type: 1, settlementType: 1, createdAt: -1 });

export const TownhallTopic = mongoose.model<ITownhallTopic>('TownhallTopic', TownhallTopicSchema);
