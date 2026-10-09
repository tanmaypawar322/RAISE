import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationChannels {
  inApp: boolean;
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
}

export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  channels: INotificationChannels;
  quietHoursEnabled: boolean;
  optOutEvents: string[];
  preferredLanguage: 'en' | 'mr' | 'hi';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    channels: {
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
    quietHoursEnabled: { type: Boolean, default: true },
    optOutEvents: [{ type: String }],
    preferredLanguage: {
      type: String,
      enum: ['en', 'mr', 'hi'],
      default: 'en',
    },
  },
  { timestamps: true }
);

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
