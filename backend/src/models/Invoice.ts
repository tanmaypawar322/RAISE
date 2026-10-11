import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceLineItem {
  description: string;
  sacCode: string;
  quantity: number;
  unitPricePaise: number;
  amountPaise: number;
}

export interface ITaxBreakdown {
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  gstRatePercent: number;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export interface IInvoice extends Document {
  number: string; // e.g. 'RAISE/INV/2026-27/000001'
  officeId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  lineItems: IInvoiceLineItem[];
  subtotalPaise: number;
  taxBreakdown: ITaxBreakdown;
  totalPaise: number;
  buyerName: string;
  buyerGstin?: string;
  buyerAddress?: string;
  buyerEmail?: string;
  placeOfSupply: string; // State e.g. 'Maharashtra'
  sacCode: string;
  status: InvoiceStatus;
  issuedAt: Date;
  paidAt?: Date;
  paymentRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: { type: String, required: true },
    sacCode: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPricePaise: { type: Number, required: true },
    amountPaise: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    officeId: {
      type: Schema.Types.ObjectId,
      ref: 'Office',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    lineItems: [InvoiceLineItemSchema],
    subtotalPaise: {
      type: Number,
      required: true,
    },
    taxBreakdown: {
      cgstPaise: { type: Number, default: 0 },
      sgstPaise: { type: Number, default: 0 },
      igstPaise: { type: Number, default: 0 },
      gstRatePercent: { type: Number, default: 18 },
    },
    totalPaise: {
      type: Number,
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    buyerGstin: {
      type: String,
    },
    buyerAddress: {
      type: String,
    },
    buyerEmail: {
      type: String,
    },
    placeOfSupply: {
      type: String,
      required: true,
    },
    sacCode: {
      type: String,
      required: true,
      default: '998313',
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'void'],
      default: 'issued',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
    },
    paymentRef: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ officeId: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
