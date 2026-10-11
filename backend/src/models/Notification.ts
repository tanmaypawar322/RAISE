import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'issue_published'
  | 'issue_acknowledged'
  | 'issue_status_updated'
  | 'issue_resolved_pending_confirmation'
  | 'issue_disputed'
  | 'issue_escalated'
  | 'issue_merged'
  | 'moderation_outcome'
  | 'supported_issue_updated'
  | 'office_new_assignment'
  | 'office_sla_warning_75'
  | 'office_sla_breached'
  | 'office_escalation_received'
  | 'rep_asked'
  | 'rep_taken_up'
  | 'rep_update_posted'
  | 'rep_report_published';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    issueId?: mongoose.Types.ObjectId;
    officeId?: mongoose.Types.ObjectId;
    linkUrl?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: Date;
  channelDelivered: string[]; // e.g. ['in_app', 'sms', 'email', 'whatsapp']
  dedupKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'issue_published',
        'issue_acknowledged',
        'issue_status_updated',
        'issue_resolved_pending_confirmation',
        'issue_disputed',
        'issue_escalated',
        'issue_merged',
        'moderation_outcome',
        'supported_issue_updated',
        'office_new_assignment',
        'office_sla_warning_75',
        'office_sla_breached',
        'office_escalation_received',
        'rep_asked',
        'rep_taken_up',
        'rep_update_posted',
        'rep_report_published',
      ],
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    channelDelivered: [{ type: String }],
    dedupKey: { type: String, sparse: true, index: true },
  },
  { timestamps: true }
);

// Compound indexes for user notification feed queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
