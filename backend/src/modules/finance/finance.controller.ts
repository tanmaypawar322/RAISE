import { Request, Response } from 'express';
import { FinanceService } from './finance.service.js';
import { FinanceEntry } from '../../models/FinanceEntry.js';

export class FinanceController {
  /**
   * GET /api/finance/public-ledger
   * Fully public transparent ledger summary.
   */
  static async getPublicLedger(req: Request, res: Response): Promise<void> {
    try {
      const summary = await FinanceService.getPublicLedger();
      res.json({ success: true, ...summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to load ledger.' });
    }
  }

  /**
   * GET /api/finance/public-ledger/export-csv
   */
  static async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const csv = await FinanceService.exportLedgerCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="raise-public-ledger.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to generate CSV export.' });
    }
  }

  /**
   * GET /api/admin/finance/entries
   */
  static async getAdminEntries(req: Request, res: Response): Promise<void> {
    try {
      const entries = await FinanceEntry.find().sort({ date: -1 }).limit(100).lean();
      res.json({ success: true, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/finance/entries
   */
  static async createAdminEntry(req: Request, res: Response): Promise<void> {
    try {
      const entry = await FinanceService.createEntry(
        req.body,
        req.user?.userId || '000000000000000000000000'
      );
      res.status(201).json({ success: true, entry });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /api/admin/finance/entries/:id
   */
  static async deleteAdminEntry(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await FinanceService.deleteEntry(
        req.params.id,
        req.user?.userId || '000000000000000000000000'
      );
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Entry not found.' });
        return;
      }
      res.json({ success: true, message: 'Entry removed successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
