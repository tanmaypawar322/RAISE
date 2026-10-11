import { FinancialSequence } from '../models/FinancialSequence.js';
import { getFinancialYear } from '../utils/money.js';

export class FinancialSequenceService {
  /**
   * Generates the next sequential invoice or donation receipt number atomically.
   * Safe under high concurrency.
   * Format: RAISE/{PREFIX}/{FINANCIAL_YEAR}/{6-DIGIT-ZERO-PADDED-SEQUENCE}
   * Examples:
   *  - RAISE/INV/2026-27/000001
   *  - RAISE/DON/2026-27/000042
   */
  static async getNextSequence(
    prefix: 'INV' | 'DON',
    date: Date = new Date()
  ): Promise<string> {
    const fy = getFinancialYear(date);

    // Atomically increment lastSequence for this prefix and financial year
    const record = await FinancialSequence.findOneAndUpdate(
      { prefix, financialYear: fy },
      { $inc: { lastSequence: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const paddedNumber = String(record.lastSequence).padStart(6, '0');
    return `RAISE/${prefix}/${fy}/${paddedNumber}`;
  }
}
