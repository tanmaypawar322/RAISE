import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaItem {
  type: 'photo' | 'video' | 'voice_note' | 'document';
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  durationSec?: number;
}

export interface IStatusTimelineItem {
  status: string;
  note?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

export interface IEscalationHistoryItem {
  fromOfficeId: mongoose.Types.ObjectId;
  toOfficeId: mongoose.Types.ObjectId;
  escalatedAt: Date;
  reason: string;
}

export type IssueStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'published'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved_pending_confirmation'
  | 'resolved'
  | 'rejected'
  | 'disputed'
  | 'merged';

export interface IConfirmationVote {
  userId: mongoose.Types.ObjectId;
  confirmedAt: Date;
}

export interface IDisputeItem {
  userId: mongoose.Types.ObjectId;
  reason: string;
  photoUrl?: string;
  disputedAt: Date;
}

export interface IResolutionNoteHistoryItem {
  note: string;
  editedBy: mongoose.Types.ObjectId;
  editedAt: Date;
}

export interface IIssue extends Document {
  authorId?: mongoose.Types.ObjectId;
  isAnonymous: boolean;
  title: string;
  description: string;
  category: 'roads' | 'water' | 'sanitation' | 'health' | 'education' | 'electricity' | 'other';
  officeId: mongoose.Types.ObjectId;
  jurisdictionId?: mongoose.Types.ObjectId;
  jurisdictionIds?: mongoose.Types.ObjectId[];
  slaHours?: number;
  slaDeadline?: Date;
  escalationLevel: number;
  escalatedAt?: Date;
  escalationHistory: IEscalationHistoryItem[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
    landmark?: string;
    ward?: string;
    city?: string;
    district?: string;
  };
  media: IMediaItem[];
  status: IssueStatus;
  raiseCount: number;
  statusTimeline: IStatusTimelineItem[];
  moderationState: 'clean' | 'flagged' | 'hidden';
  moderationLabels?: string[];
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  appealReason?: string;
  appealedAt?: Date;

  // Phase 2: Resolution Proof
  resolutionNotes?: string;
  resolutionNotesHistory: IResolutionNoteHistoryItem[];
  resolutionExceptionReason?:
    | 'no_physical_work_required'
    | 'administrative_action_only'
    | 'duplicate_work_order'
    | 'jurisdiction_transferred';
  afterPhotos: IMediaItem[];
  afterPhotoGpsFlag?: boolean;
  afterPhotoDistanceMeters?: number;
  resolvedAt?: Date;

  // Phase 2: Citizen Confirmation & Dispute
  confirmationDeadline?: Date;
  confirmationStatus?: 'pending_citizen_confirmation' | 'resolved_confirmed' | 'resolved_unconfirmed';
  confirmations: IConfirmationVote[];
  confirmedByCount: number;
  disputes: IDisputeItem[];
  disputedByCount: number;
  reopenCount: number;

  rejectionReason?: string;

  // Phase 2: Duplicate & Merge
  possibleDuplicateOf?: mongoose.Types.ObjectId;
  mergedIntoId?: mongoose.Types.ObjectId;
  mergedIssueIds?: mongoose.Types.ObjectId[];
  mergedAt?: Date;
  mergedBy?: mongoose.Types.ObjectId;
  canUnmergeUntil?: Date;

  // Representatives & Citizen Credit
  takenUpByRepIds: mongoose.Types.ObjectId[];
  repActionHistory: Array<{
    repId: mongoose.Types.ObjectId;
    action: string;
    note?: string;
    timestamp: Date;
  }>;
  thankedUserIds: mongoose.Types.ObjectId[];
  thanksCount: number;

  // Grassroots Rural & Multi-Tier Escalation
  settlementType?: 'rural_panchayat' | 'urban_municipal';
  escalationTier: number; // 1 to 5
  isCommunityVerified: boolean;
  communityVerifiedAt?: Date;
  activeDirectiveId?: mongoose.Types.ObjectId;
  assistedReporting?: {
    isAssisted: boolean;
    assistedByUserId?: mongoose.Types.ObjectId;
    citizenName?: string;
    citizenPhoneMasked?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    type: { type: String, enum: ['photo', 'video', 'voice_note', 'document'], required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number },
    durationSec: { type: Number },
  },
  { _id: false }
);

const StatusTimelineItemSchema = new Schema<IStatusTimelineItem>(
  {
    status: { type: String, required: true },
    note: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssue>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    isAnonymous: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['roads', 'water', 'sanitation', 'health', 'education', 'electricity', 'other'],
      required: true,
      index: true,
    },
    officeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true, index: true },
    jurisdictionId: { type: Schema.Types.ObjectId, ref: 'Jurisdiction', index: true },
    jurisdictionIds: [{ type: Schema.Types.ObjectId, ref: 'Jurisdiction', index: true }],
    slaHours: { type: Number, default: 48 },
    slaDeadline: { type: Date, index: true },
    escalationLevel: { type: Number, default: 0, index: true },
    escalatedAt: { type: Date },
    escalationHistory: [
      {
        fromOfficeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true },
        toOfficeId: { type: Schema.Types.ObjectId, ref: 'Office', required: true },
        escalatedAt: { type: Date, default: Date.now },
        reason: { type: String, default: 'sla_breach' },
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        index: '2dsphere',
      },
      address: { type: String },
      landmark: { type: String },
      ward: { type: String },
      city: { type: String, default: 'Pimpri-Chinchwad' },
      district: { type: String, default: 'Pune' },
    },
    media: [MediaItemSchema],
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'under_review',
        'published',
        'acknowledged',
        'in_progress',
        'resolved_pending_confirmation',
        'resolved',
        'rejected',
        'disputed',
        'merged',
      ],
      default: 'published',
      index: true,
    },
    raiseCount: { type: Number, default: 1, index: true },
    statusTimeline: [StatusTimelineItemSchema],
    moderationState: {
      type: String,
      enum: ['clean', 'flagged', 'hidden'],
      default: 'clean',
      index: true,
    },
    moderationLabels: { type: [String], default: [] },
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      index: true,
    },
    appealReason: { type: String },
    appealedAt: { type: Date },

    // Phase 2: Resolution Proof
    resolutionNotes: { type: String },
    resolutionNotesHistory: [
      {
        note: { type: String, required: true },
        editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date, default: Date.now },
      },
    ],
    resolutionExceptionReason: {
      type: String,
      enum: [
        'no_physical_work_required',
        'administrative_action_only',
        'duplicate_work_order',
        'jurisdiction_transferred',
      ],
    },
    afterPhotos: [MediaItemSchema],
    afterPhotoGpsFlag: { type: Boolean, default: false },
    afterPhotoDistanceMeters: { type: Number },
    resolvedAt: { type: Date },

    // Phase 2: Citizen Confirmation & Dispute
    confirmationDeadline: { type: Date, index: true },
    confirmationStatus: {
      type: String,
      enum: ['pending_citizen_confirmation', 'resolved_confirmed', 'resolved_unconfirmed'],
      index: true,
    },
    confirmations: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        confirmedAt: { type: Date, default: Date.now },
      },
    ],
    confirmedByCount: { type: Number, default: 0 },
    disputes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, required: true },
        photoUrl: { type: String },
        disputedAt: { type: Date, default: Date.now },
      },
    ],
    disputedByCount: { type: Number, default: 0 },
    reopenCount: { type: Number, default: 0 },

    rejectionReason: { type: String },

    // Phase 2: Duplicate & Merge
    possibleDuplicateOf: { type: Schema.Types.ObjectId, ref: 'Issue', index: true },
    mergedIntoId: { type: Schema.Types.ObjectId, ref: 'Issue', index: true },
    mergedIssueIds: [{ type: Schema.Types.ObjectId, ref: 'Issue' }],
    mergedAt: { type: Date },
    mergedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    canUnmergeUntil: { type: Date },

    // Representatives & Citizen Credit
    takenUpByRepIds: [{ type: Schema.Types.ObjectId, ref: 'RepresentativeProfile', index: true }],
    repActionHistory: [
      {
        repId: { type: Schema.Types.ObjectId, ref: 'RepresentativeProfile', required: true },
        action: { type: String, required: true },
        note: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    thankedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    thanksCount: { type: Number, default: 0 },

    // Grassroots Rural & Multi-Tier Escalation
    settlementType: {
      type: String,
      enum: ['rural_panchayat', 'urban_municipal'],
      default: 'urban_municipal',
      index: true,
    },
    escalationTier: { type: Number, default: 1, index: true },
    isCommunityVerified: { type: Boolean, default: false, index: true },
    communityVerifiedAt: { type: Date },
    activeDirectiveId: { type: Schema.Types.ObjectId, ref: 'EscalationDirective' },
    assistedReporting: {
      isAssisted: { type: Boolean, default: false },
      assistedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
      citizenName: { type: String, trim: true },
      citizenPhoneMasked: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

// MongoDB text search index for duplicate detection and free-text search
IssueSchema.index({ title: 'text', description: 'text' });

// Phase 3: Compound indexes for high-performance cursor pagination and neutral sorting
IssueSchema.index({ raiseCount: -1, _id: -1 });
IssueSchema.index({ createdAt: -1, _id: -1 });
IssueSchema.index({ updatedAt: -1, _id: -1 });
IssueSchema.index({ status: 1, slaDeadline: 1, _id: -1 });
IssueSchema.index({ category: 1, status: 1, createdAt: -1 });
IssueSchema.index({ 'location.ward': 1, createdAt: -1 });

export const Issue = mongoose.model<IIssue>('Issue', IssueSchema);

