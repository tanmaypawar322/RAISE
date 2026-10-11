import mongoose from 'mongoose';
import { MonthlyReport, IMonthlyReport } from '../models/MonthlyReport.js';
import { RepresentativeProfile } from '../models/RepresentativeProfile.js';
import { Office } from '../models/Office.js';
import { Issue } from '../models/Issue.js';
import { RepresentativeAsk } from '../models/RepresentativeAsk.js';
import { AuditService } from './audit.service.js';

export interface MonthlyReportGenerationResult {
  period: string;
  repReportsGenerated: number;
  officeReportsGenerated: number;
  publishedCount: number;
}

export class MonthlyReportService {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Helper to get period string YYYY-MM and start/end dates
   */
  static getMonthPeriod(targetDate?: Date): {
    period: string;
    startDate: Date;
    endDate: Date;
    replyDeadline: Date;
  } {
    const d = targetDate ? new Date(targetDate) : new Date();
    // Default to previous calendar month if no date passed
    let year = d.getFullYear();
    let month = d.getMonth(); // 0-indexed; current month

    // Target is previous month
    if (!targetDate) {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }

    const monthStr = String(month + 1).padStart(2, '0');
    const period = `${year}-${monthStr}`;

    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    // Last day of month
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    // Right of reply deadline: 5 days from generation / 5th of current month at 23:59:59
    const replyDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    return { period, startDate, endDate, replyDeadline };
  }

  /**
   * Generate draft monthly reports for all verified representatives and active offices
   */
  static async generateMonthlyReports(targetMonthDate?: Date): Promise<MonthlyReportGenerationResult> {
    const { period, startDate, endDate, replyDeadline } = this.getMonthPeriod(targetMonthDate);

    let repReportsGenerated = 0;
    let officeReportsGenerated = 0;

    // 1. Process Verified Representatives
    const reps = await RepresentativeProfile.find({
      status: { $in: ['verified', 'term_ended'] },
    });

    for (const rep of reps) {
      // Find issues taken up or asks created in this period
      const issues = await Issue.find({
        takenUpByRepIds: rep._id,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'draft' },
      });

      const asks = await RepresentativeAsk.find({
        representativeProfileId: rep._id,
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const totalReceived = issues.length + asks.length;
      const sampleSize = totalReceived;
      const isSampleTooSmall = sampleSize < 10;

      // Confirmed resolved issues
      const confirmedResolved = issues.filter(
        (i) => i.status === 'resolved' && (i.confirmedByCount || 0) > 0
      ).length;

      // Thanks count
      const citizenThanksCount = issues.reduce((acc, i) => acc + (i.thanksCount || 0), 0);

      // Asks SLA Compliance
      const answeredAsks = asks.filter((a) => a.status === 'taken_up' || a.status === 'acknowledged');
      const slaComplianceRate = asks.length > 0
        ? Math.round((answeredAsks.length / asks.length) * 100)
        : null;

      // Response times calculation
      const responseTimesHours: number[] = [];
      for (const ask of asks) {
        if (ask.takenUpAt) {
          const diffHours = (ask.takenUpAt.getTime() - ask.createdAt.getTime()) / (1000 * 60 * 60);
          responseTimesHours.push(diffHours);
        }
      }
      responseTimesHours.sort((a, b) => a - b);
      const medianFirstResponseHours = responseTimesHours.length > 0
        ? Math.round(responseTimesHours[Math.floor(responseTimesHours.length / 2)] * 10) / 10
        : null;

      // Top 3 Categories
      const catCount: Record<string, number> = {};
      for (const iss of issues) {
        catCount[iss.category] = (catCount[iss.category] || 0) + 1;
      }
      const top3Categories = Object.entries(catCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => ({ category, count }));

      const metricsSnapshot = {
        totalIssuesReceived: totalReceived,
        sampleSize,
        isSampleTooSmall,
        confirmedResolvedCount: confirmedResolved,
        citizenThanksCount,
        slaComplianceRate: isSampleTooSmall ? null : slaComplianceRate,
        medianFirstResponseHours: isSampleTooSmall ? null : medianFirstResponseHours,
        medianResolutionHours: null,
        top3Categories,
        generatedAt: new Date(),
      };

      await MonthlyReport.findOneAndUpdate(
        { targetType: 'representative', targetId: rep._id, period },
        {
          $set: {
            metricsSnapshot,
            replyDeadline,
            draftGeneratedAt: new Date(),
          },
          $setOnInsert: {
            status: 'draft_reply_window',
          },
        },
        { upsert: true, new: true }
      );
      repReportsGenerated++;
    }

    // 2. Process Offices
    const offices = await Office.find();

    for (const office of offices) {
      const officeIssues = await Issue.find({
        officeId: office._id,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'draft' },
      });

      const sampleSize = officeIssues.length;
      const isSampleTooSmall = sampleSize < 10;

      const confirmedResolved = officeIssues.filter(
        (i) => i.status === 'resolved' && (i.confirmedByCount || 0) > 0
      ).length;

      const citizenThanksCount = officeIssues.reduce((acc, i) => acc + (i.thanksCount || 0), 0);

      // SLA Compliance
      const resolvedWithinSla = officeIssues.filter(
        (i) => i.status === 'resolved' && i.slaDeadline && i.resolvedAt && i.resolvedAt <= i.slaDeadline
      ).length;
      const slaComplianceRate = officeIssues.length > 0
        ? Math.round((resolvedWithinSla / officeIssues.length) * 100)
        : null;

      // Median Resolution Hours
      const resolutionHours: number[] = [];
      for (const i of officeIssues) {
        if (i.resolvedAt) {
          const diff = (i.resolvedAt.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60);
          resolutionHours.push(diff);
        }
      }
      resolutionHours.sort((a, b) => a - b);
      const medianResolutionHours = resolutionHours.length > 0
        ? Math.round(resolutionHours[Math.floor(resolutionHours.length / 2)] * 10) / 10
        : null;

      // Top 3 Categories
      const catCount: Record<string, number> = {};
      for (const iss of officeIssues) {
        catCount[iss.category] = (catCount[iss.category] || 0) + 1;
      }
      const top3Categories = Object.entries(catCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => ({ category, count }));

      const metricsSnapshot = {
        totalIssuesReceived: officeIssues.length,
        sampleSize,
        isSampleTooSmall,
        confirmedResolvedCount: confirmedResolved,
        citizenThanksCount,
        slaComplianceRate: isSampleTooSmall ? null : slaComplianceRate,
        medianFirstResponseHours: null,
        medianResolutionHours: isSampleTooSmall ? null : medianResolutionHours,
        top3Categories,
        generatedAt: new Date(),
      };

      await MonthlyReport.findOneAndUpdate(
        { targetType: 'office', targetId: office._id, period },
        {
          $set: {
            metricsSnapshot,
            replyDeadline,
            draftGeneratedAt: new Date(),
          },
          $setOnInsert: {
            status: 'draft_reply_window',
          },
        },
        { upsert: true, new: true }
      );
      officeReportsGenerated++;
    }

    // Auto-publish any past-due reports
    const publishedCount = await this.publishDueReports();

    await AuditService.log({
      action: 'monthly_reports_generated',
      targetType: 'monthly_report',
      details: {
        period,
        repReportsGenerated,
        officeReportsGenerated,
        publishedCount,
      },
    });

    return {
      period,
      repReportsGenerated,
      officeReportsGenerated,
      publishedCount,
    };
  }

  /**
   * Automatically publish reports whose 5-day right-of-reply deadline has elapsed
   */
  static async publishDueReports(): Promise<number> {
    const now = new Date();
    const result = await MonthlyReport.updateMany(
      {
        status: 'draft_reply_window',
        replyDeadline: { $lte: now },
      },
      {
        $set: {
          status: 'published',
          publishedAt: now,
        },
      }
    );

    return result.modifiedCount || 0;
  }

  /**
   * Starts daily scheduler to check for 1st of month report generation and publishing
   */
  static startScheduler(intervalMs = 24 * 60 * 60 * 1000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(async () => {
      try {
        const now = new Date();
        // If it's the 1st of the month, generate previous month reports
        if (now.getDate() === 1) {
          await this.generateMonthlyReports();
        }
        // Daily publish due reports
        await this.publishDueReports();
      } catch (err) {
        console.error('[MONTHLY-REPORT-SCHEDULER] Error during periodic report processing:', err);
      }
    }, intervalMs);

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  static stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
