import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  provider: 'razorpay' | 'mock';
  providerEventId: string;
  eventType: string;
  payload: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  processingError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: {
      type: String,
      enum: ['razorpay', 'mock'],
      required: true,
      index: true,
    },
    providerEventId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: {
      type: Date,
    },
    processingError: {
      type: String,
    },
  },
  { timestamps: true }
);

// Unique index to guarantee idempotency across replays
WebhookEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });

export const WebhookEvent = mongoose.model<IWebhookEvent>(
  'WebhookEvent',
  WebhookEventSchema
);
