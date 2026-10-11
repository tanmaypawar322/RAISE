import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { MonthlyReport } from '../../models/MonthlyReport.js';
import { RepresentativeProfile } from '../../models/RepresentativeProfile.js';
import { Office } from '../../models/Office.js';
import { User } from '../../models/User.js';
import { AuditService } from '../../services/audit.service.js';

const ReportReplySchema = z.object({
  replyText: z.string().min(5).max(2000),
});

export class ReportsController {
  /**
   * Public printable monthly report for an elected representative
   * (/reports/rep/[representativeId]/[month])
   */
  static async getRepresentativeMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { representativeId, month } = req.params;

      const representative = await RepresentativeProfile.findById(representativeId).populate('jurisdictionId');
      if (!representative) {
        res.status(404).json({ success: false, message: 'Representative not found.' });
        return;
      }

      const report = await MonthlyReport.findOne({
        targetType: 'representative',
        targetId: representative._id,
        period: month,
      }).populate('replySubmittedBy', 'displayName role');

      if (!report) {
        res.status(404).json({ success: false, message: 'Monthly report for this period not found.' });
        return;
      }

      // If still in draft right-of-reply window, only representative office staff and admin can view draft
      if (report.status === 'draft_reply_window') {
        const userId = req.user?.userId;
        let isAuthorized = req.user?.role === 'admin';

        if (userId && representative.officeId) {
          const user = await User.findById(userId);
          if (user) {
            isAuthorized = user.officeMemberships.some(
              (m) => m.officeId.toString() === representative.officeId?.toString() && m.status === 'active'
            );
          }
        }

        if (!isAuthorized) {
          res.status(403).json({
            success: false,
            message: 'Report is currently in 5-day right-of-reply draft review window. It will publish automatically on the 6th.',
            replyDeadline: report.replyDeadline,
          });
          return;
        }
      }

      res.json({
        success: true,
        report,
        representative: {
          _id: representative._id,
          displayName: representative.displayName,
          role: representative.role,
          titleText: representative.titleText,
          jurisdiction: representative.jurisdictionId,
          status: representative.status,
          photoUrl: representative.photoUrl,
          officialSiteUrl: representative.officialSiteUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public printable monthly report for a public office
   * (/reports/[officeId]/[month])
   */
  static async getOfficeMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { officeId, month } = req.params;

      const office = await Office.findById(officeId).populate('jurisdiction');
      if (!office) {
        res.status(404).json({ success: false, message: 'Office not found.' });
        return;
      }

      const report = await MonthlyReport.findOne({
        targetType: 'office',
        targetId: office._id,
        period: month,
      }).populate('replySubmittedBy', 'displayName role');

      if (!report) {
        res.status(404).json({ success: false, message: 'Monthly report for this period not found.' });
        return;
      }

      // If draft, only office staff and admin can view
      if (report.status === 'draft_reply_window') {
        const userId = req.user?.userId;
        let isAuthorized = req.user?.role === 'admin';

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            isAuthorized = user.officeMemberships.some(
              (m) => m.officeId.toString() === office._id.toString() && m.status === 'active'
            );
          }
        }

        if (!isAuthorized) {
          res.status(403).json({
            success: false,
            message: 'Report is currently in 5-day right-of-reply review window. It will publish automatically on the 6th.',
            replyDeadline: report.replyDeadline,
          });
          return;
        }
      }

      res.json({
        success: true,
        report,
        office: {
          _id: office._id,
          name: office.name,
          nameMr: office.nameMr,
          nameHi: (office as any).nameHi,
          department: office.department,
          level: office.level,
          jurisdiction: office.jurisdiction,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Office formal right of reply submission (5-day window)
   */
  static async submitOfficeReportReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const { replyText } = ReportReplySchema.parse(req.body);
      const userId = req.user!.userId;

      const report = await MonthlyReport.findById(reportId);
      if (!report || report.targetType !== 'office') {
        res.status(404).json({ success: false, message: 'Office monthly report not found.' });
        return;
      }

      if (report.status === 'published') {
        res.status(400).json({ success: false, message: 'Report is already published. Submit a correction request instead.' });
        return;
      }

      if (new Date() > report.replyDeadline) {
        res.status(400).json({ success: false, message: '5-day right-of-reply window has expired.' });
        return;
      }

      // Authorization: must belong to the owning office or be admin
      const user = await User.findById(userId);
      const isMember = user?.officeMemberships.some(
        (m) => m.officeId.toString() === report.targetId.toString() && m.status === 'active'
      );
      if (!isMember && req.user?.role !== 'admin') {
        res.status(403).json({ success: false, message: 'Unauthorized for this office report.' });
        return;
      }

      report.replyText = replyText;
      report.replySubmittedAt = new Date();
      report.replySubmittedBy = new mongoose.Types.ObjectId(userId);
      await report.save();

      await AuditService.log({
        actorId: userId,
        actorRole: req.user!.role,
        action: 'office_monthly_report_reply_submitted',
        targetType: 'monthly_report',
        targetId: report._id.toString(),
      });

      res.json({
        success: true,
        message: 'Formal reply saved. It will publish alongside metrics on the 6th.',
        report,
      });
    } catch (err) {
      next(err);
    }
  }
}
