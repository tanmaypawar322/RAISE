import mongoose from 'mongoose';
import { Office } from '../models/Office.js';
import { RepresentativeProfile } from '../models/RepresentativeProfile.js';
import { Issue } from '../models/Issue.js';
import { RepresentativeAsk } from '../models/RepresentativeAsk.js';
import { MetricSnapshot, IMetricSnapshot } from '../models/MetricSnapshot.js';

export const MIN_SAMPLE_FOR_SCORECARD = 10;

export function formatIstDate(d: Date = new Date()): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).format(d);
    return `As of ${parts} IST`;
  } catch {
    return `As of ${d.toISOString().slice(0, 10)} IST`;
  }
}

export class MetricsService {
  /**
   * Computes fair scorecard metrics for a civic office
   */
  static async computeOfficeMetrics(
    officeId: string | mongoose.Types.ObjectId,
    period: string = 'all_time'
  ): Promise<IMetricSnapshot | null> {
    const office = await Office.findById(officeId);
    if (!office) return null;

    // Base query for issues received by this office
    // Fairness rule: Exclude issues routed to the wrong office that were rerouted within 48h
    const query: any = {
      officeId: office._id,
      reroutedWithin48h: { $ne: true },
    };

    const issues = await Issue.find(query);
    const sampleSize = issues.length;
    const isSampleTooSmall = sampleSize < MIN_SAMPLE_FOR_SCORECARD;
    const isUnclaimed = office.claimStatus !== 'claimed';

    let acknowledgedWithinSlaPct: number | null = null;
    let resolvedWithinSlaPct: number | null = null;
    let citizenConfirmedPct: number | null = null;
    let disputedPct: number | null = null;
    let medianResolutionHours: number | null = null;
    let reopenedCount = 0;

    for (const issue of issues) {
      if (issue.reopenCount) reopenedCount += issue.reopenCount;
    }

    // Unclaimed offices and small sample sizes show COUNTS ONLY, no percentages or scores
    if (!isSampleTooSmall && !isUnclaimed) {
      // 1. Acknowledged within statutory SLA %
      const ackCount = issues.filter(
        (i) =>
          i.statusTimeline?.some((t) => t.status === 'acknowledged') ||
          i.status === 'acknowledged' ||
          i.status === 'in_progress' ||
          i.status === 'resolved'
      ).length;
      acknowledgedWithinSlaPct = Math.round((ackCount / Math.max(1, sampleSize)) * 100);

      // 2. Resolved within SLA %
      const resolvedIssues = issues.filter((i) => i.status === 'resolved');
      const resolvedWithinSla = resolvedIssues.filter((i) => {
        if (!i.slaDeadline) return true;
        const resolvedEvent = i.statusTimeline?.find((t) => t.status === 'resolved');
        const resolvedTime = resolvedEvent ? new Date(resolvedEvent.updatedAt).getTime() : i.updatedAt.getTime();
        return resolvedTime <= new Date(i.slaDeadline).getTime();
      }).length;
      resolvedWithinSlaPct = Math.round((resolvedWithinSla / Math.max(1, sampleSize)) * 100);

      // 3. Citizen confirmed % & disputed % (of resolved issues)
      if (resolvedIssues.length > 0) {
        const confirmedCount = resolvedIssues.filter((i) => (i.confirmedByCount || 0) > 0).length;
        citizenConfirmedPct = Math.round((confirmedCount / resolvedIssues.length) * 100);

        const disputedCount = resolvedIssues.filter(
          (i) => (i.disputedByCount || 0) > 0 || (i.reopenCount || 0) > 0
        ).length;
        disputedPct = Math.round((disputedCount / resolvedIssues.length) * 100);

        // 4. Median resolution hours
        const durationsHours = resolvedIssues.map((i) => {
          const resolvedEvent = i.statusTimeline?.find((t) => t.status === 'resolved');
          const resolvedTime = resolvedEvent ? new Date(resolvedEvent.updatedAt).getTime() : i.updatedAt.getTime();
          return Math.max(1, Math.round((resolvedTime - new Date(i.createdAt).getTime()) / (1000 * 60 * 60)));
        });
        durationsHours.sort((a, b) => a - b);
        const mid = Math.floor(durationsHours.length / 2);
        medianResolutionHours =
          durationsHours.length % 2 !== 0
            ? durationsHours[mid]
            : Math.round((durationsHours[mid - 1] + durationsHours[mid]) / 2);
      }
    }

    const snapshot = await MetricSnapshot.findOneAndUpdate(
      { targetType: 'office', targetId: office._id, period },
      {
        sampleSize,
        isSampleTooSmall: isSampleTooSmall || isUnclaimed,
        metrics: {
          issuesReceived: sampleSize,
          acknowledgedWithinSlaPct,
          resolvedWithinSlaPct,
          citizenConfirmedPct,
          disputedPct,
          medianResolutionHours,
          reopenedCount,
        },
        computedAt: new Date(),
        computedAtFormatted: formatIstDate(new Date()),
      },
      { upsert: true, new: true }
    );

    return snapshot;
  }

  /**
   * Computes fair public credit metrics for an elected representative
   */
  static async computeRepresentativeMetrics(
    repId: string | mongoose.Types.ObjectId,
    period: string = 'all_time'
  ): Promise<IMetricSnapshot | null> {
    const rep = await RepresentativeProfile.findById(repId);
    if (!rep) return null;

    const asks = await RepresentativeAsk.find({ representativeProfileId: rep._id });
    const asksReceived = asks.length;
    const isSampleTooSmall = asksReceived < MIN_SAMPLE_FOR_SCORECARD;
    const isUnclaimed = rep.status === 'unclaimed';

    // 1. Response Rate % within 72 hours
    let responseRatePct: number | null = null;
    if (!isSampleTooSmall && !isUnclaimed) {
      const respondedAsks = asks.filter((a) => {
        if (a.status === 'pending') return false;
        if (a.takenUpAt && a.slaDeadline) {
          return new Date(a.takenUpAt) <= new Date(a.slaDeadline);
        }
        return true;
      });
      responseRatePct = Math.round((respondedAsks.length / Math.max(1, asksReceived)) * 100);
    }

    // 2. Issues Taken Up
    const issuesTakenUp = await Issue.countDocuments({ takenUpByRepIds: rep._id });

    // 3. Citizen-Confirmed Resolutions (Only department-resolved + citizen-confirmed count toward credit)
    const confirmedResolutions = await Issue.countDocuments({
      takenUpByRepIds: rep._id,
      status: 'resolved',
      confirmedByCount: { $gt: 0 },
    });

    // 4. Citizen Thanks Count
    const thanksAgg = await Issue.aggregate([
      { $match: { takenUpByRepIds: rep._id, status: 'resolved' } },
      { $group: { _id: null, totalThanks: { $sum: '$thanksCount' } } },
    ]);
    const citizenThanksCount = thanksAgg[0]?.totalThanks || 0;

    const snapshot = await MetricSnapshot.findOneAndUpdate(
      { targetType: 'representative', targetId: rep._id, period },
      {
        sampleSize: asksReceived,
        isSampleTooSmall: isSampleTooSmall || isUnclaimed,
        metrics: {
          asksReceived,
          responseRatePct,
          issuesTakenUp,
          confirmedResolutions,
          citizenThanksCount,
        },
        computedAt: new Date(),
        computedAtFormatted: formatIstDate(new Date()),
      },
      { upsert: true, new: true }
    );

    return snapshot;
  }
}
