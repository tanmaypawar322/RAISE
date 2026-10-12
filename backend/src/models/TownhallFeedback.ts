import mongoose, { Schema, Document } from 'mongoose';

export type TownhallFeedbackType = 'support' | 'concern' | 'amendment';

export interface ITownhallFeedback extends Document {
  topicId: mongoose.Types.ObjectId;
  clauseId?: string;
  userId: mongoose.Types.ObjectId;
  type: TownhallFeedbackType;
  content: string;
  upvotes: number;
  upvotedUserIds: mongoose.Types.ObjectId[];
  isPreModerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TownhallFeedbackSchema = new Schema<ITownhallFeedback>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'TownhallTopic',
      required: true,
      index: true,
    },
    clauseId: {
      type: String,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['support', 'concern', 'amendment'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedUserIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    isPreModerated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TownhallFeedbackSchema.index({ topicId: 1, createdAt: -1 });

export const TownhallFeedback = mongoose.model<ITownhallFeedback>(
  'TownhallFeedback',
  TownhallFeedbackSchema
);
