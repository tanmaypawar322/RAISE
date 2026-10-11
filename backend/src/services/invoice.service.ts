import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { Invoice, IInvoice, IInvoiceLineItem, ITaxBreakdown } from '../models/Invoice.js';
import { FinancialSequenceService } from './financial-sequence.service.js';
import { formatInr } from '../utils/money.js';

export interface CreateInvoiceParams {
  officeId: string | mongoose.Types.ObjectId;
  subscriptionId?: string | mongoose.Types.ObjectId;
  buyerName: string;
  buyerGstin?: string;
  buyerAddress?: string;
  buyerEmail?: string;
  placeOfSupply: string;
  lineItems: Array<{
    description: string;
    sacCode?: string;
    quantity?: number;
    unitPricePaise: number;
  }>;
  status?: 'draft' | 'issued' | 'paid';
  notes?: string;
}

export class InvoiceService {
  /**
   * Computes GST breakdown based on place of supply vs organization state
   */
  static computeTaxes(subtotalPaise: number, placeOfSupply: string): ITaxBreakdown {
    const rate = config.gstRatePercent;
    const isIntraState =
      placeOfSupply.trim().toLowerCase() === config.orgState.trim().toLowerCase();

    if (isIntraState) {
      const halfRate = rate / 2;
      const cgstPaise = Math.round(subtotalPaise * (halfRate / 100));
      const sgstPaise = Math.round(subtotalPaise * (halfRate / 100));
      return {
        cgstPaise,
        sgstPaise,
        igstPaise: 0,
        gstRatePercent: rate,
      };
    } else {
      const igstPaise = Math.round(subtotalPaise * (rate / 100));
      return {
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise,
        gstRatePercent: rate,
      };
    }
  }

  /**
   * Generates a sequential, tax-compliant invoice
   * NOTE: Format and wording must be confirmed with the organisation's Chartered Accountant.
   */
  static async createInvoice(params: CreateInvoiceParams): Promise<IInvoice> {
    const invoiceNumber = await FinancialSequenceService.getNextSequence('INV');

    const formattedLineItems: IInvoiceLineItem[] = params.lineItems.map((item) => {
      const qty = item.quantity || 1;
      const amountPaise = item.unitPricePaise * qty;
      return {
        description: item.description,
        sacCode: item.sacCode || config.gstSacCode,
        quantity: qty,
        unitPricePaise: item.unitPricePaise,
        amountPaise,
      };
    });

    const subtotalPaise = formattedLineItems.reduce((acc, cur) => acc + cur.amountPaise, 0);
    const taxBreakdown = this.computeTaxes(subtotalPaise, params.placeOfSupply);
    const totalPaise =
      subtotalPaise +
      taxBreakdown.cgstPaise +
      taxBreakdown.sgstPaise +
      taxBreakdown.igstPaise;

    const invoice = await Invoice.create({
      number: invoiceNumber,
      officeId: new mongoose.Types.ObjectId(params.officeId),
      subscriptionId: params.subscriptionId
        ? new mongoose.Types.ObjectId(params.subscriptionId)
        : undefined,
      lineItems: formattedLineItems,
      subtotalPaise,
      taxBreakdown,
      totalPaise,
      buyerName: params.buyerName,
      buyerGstin: params.buyerGstin,
      buyerAddress: params.buyerAddress,
      buyerEmail: params.buyerEmail,
      placeOfSupply: params.placeOfSupply,
      sacCode: config.gstSacCode,
      status: params.status || 'issued',
      notes: params.notes,
      issuedAt: new Date(),
    });

    return invoice;
  }

  /**
   * Generates an accessible, print-ready HTML/PDF representation of the invoice.
   * NOTE: Invoice statutory format must be confirmed with the organisation's CA before live production use.
   */
  static renderInvoiceHtml(invoice: IInvoice): string {
    const isIntraState =
      invoice.placeOfSupply.trim().toLowerCase() === config.orgState.trim().toLowerCase();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${invoice.number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: auto; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; display: flex; justify-content: space-between; }
    .badge { display: inline-block; padding: 4px 12px; font-weight: 600; border-radius: 9999px; font-size: 12px; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-issued { background: #fef3c7; color: #92400e; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 13px; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .totals { margin-left: auto; width: 300px; font-size: 14px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand-total { font-weight: bold; font-size: 16px; border-top: 2px solid #0f172a; padding-top: 8px; }
    .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 24px; color: #0f172a;">TAX INVOICE</h1>
      <p style="margin: 4px 0 0 0; color: #64748b; font-weight: 500;">${invoice.number}</p>
    </div>
    <div style="text-align: right;">
      <span class="badge ${invoice.status === 'paid' ? 'badge-paid' : 'badge-issued'}">
        ${invoice.status.toUpperCase()}
      </span>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">
        Date: ${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}
      </p>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <strong style="color: #0f172a;">Supplier:</strong><br>
      ${config.orgLegalName}<br>
      ${config.orgAddress}<br>
      State: ${config.orgState}<br>
      ${config.orgGstin ? `GSTIN: ${config.orgGstin}<br>` : ''}
      ${config.orgPan ? `PAN: ${config.orgPan}<br>` : ''}
      Email: ${config.supportEmail}
    </div>
    <div>
      <strong style="color: #0f172a;">Billed To:</strong><br>
      ${invoice.buyerName}<br>
      ${invoice.buyerAddress ? `${invoice.buyerAddress}<br>` : ''}
      Place of Supply: ${invoice.placeOfSupply}<br>
      ${invoice.buyerGstin ? `GSTIN: ${invoice.buyerGstin}<br>` : ''}
      ${invoice.buyerEmail ? `Email: ${invoice.buyerEmail}` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>SAC Code</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems
        .map(
          (li) => `<tr>
          <td>${li.description}</td>
          <td>${li.sacCode}</td>
          <td style="text-align: right;">${formatInr(li.unitPricePaise)}</td>
          <td style="text-align: center;">${li.quantity}</td>
          <td style="text-align: right;">${formatInr(li.amountPaise)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatInr(invoice.subtotalPaise)}</span>
    </div>
    ${
      isIntraState
        ? `
      <div class="totals-row">
        <span>CGST (${invoice.taxBreakdown.gstRatePercent / 2}%):</span>
        <span>${formatInr(invoice.taxBreakdown.cgstPaise)}</span>
      </div>
      <div class="totals-row">
        <span>SGST (${invoice.taxBreakdown.gstRatePercent / 2}%):</span>
        <span>${formatInr(invoice.taxBreakdown.sgstPaise)}</span>
      </div>
    `
        : `
      <div class="totals-row">
        <span>IGST (${invoice.taxBreakdown.gstRatePercent}%):</span>
        <span>${formatInr(invoice.taxBreakdown.igstPaise)}</span>
      </div>
    `
    }
    <div class="totals-row grand-total">
      <span>Total Amount:</span>
      <span>${formatInr(invoice.totalPaise)}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated tax invoice issued by RAISE Civic Trust Foundation. For questions or corrections, please contact ${config.supportEmail}.</p>
    ${invoice.paymentRef ? `<p><strong>Payment Reference:</strong> ${invoice.paymentRef} (Paid on: ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('en-IN') : 'N/A'})</p>` : ''}
  </div>
</body>
</html>`;
  }
}
