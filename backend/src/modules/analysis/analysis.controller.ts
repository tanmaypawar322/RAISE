import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Office } from '../../models/Office.js';
import { User } from '../../models/User.js';
import { Issue } from '../../models/Issue.js';
import { Jurisdiction } from '../../models/Jurisdiction.js';
import { AuditService } from '../../services/audit.service.js';

export class AnalysisController {
  /**
   * Helper to verify user permissions and resolve analysis scope
   */
  private static async resolveExecutiveScope(user: any): Promise<{
    isAuthorized: boolean;
    office: any | null;
    jurisdictionScopeIds: mongoose.Types.ObjectId[];
    departmentScope: string[];
    scopeDescription: string;
  }> {
    if (user.role === 'admin') {
      return {
        isAuthorized: true,
        office: null,
        jurisdictionScopeIds: [],
        departmentScope: [],
        scopeDescription: 'All Jurisdictions & Departments (Platform Admin)',
      };
    }

    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return { isAuthorized: false, office: null, jurisdictionScopeIds: [], departmentScope: [], scopeDescription: '' };
    }

    const activeMemberships = dbUser.officeMemberships.filter((m) => m.status === 'active');
    const officeIds = activeMemberships.map((m) => m.officeId);

    const offices = await Office.find({ _id: { $in: officeIds } });

    // Look for upper-level office: kind === 'ministry' | 'executive_office' or level >= 'district' | 'state'
    const execOffice = offices.find(
      (o) =>
        o.kind === 'ministry' ||
        o.kind === 'executive_office' ||
        ['district', 'state'].includes(o.level)
    );

    if (!execOffice) {
      return { isAuthorized: false, office: null, jurisdictionScopeIds: [], departmentScope: [], scopeDescription: '' };
    }

    const jurisdictionScopeIds = (execOffice.jurisdictionScope || []).map((id) => new mongoose.Types.ObjectId(id));
    const departmentScope = execOffice.departmentScope || [];

    const scopeDescription = `${execOffice.name} (${execOffice.kind ? execOffice.kind.toUpperCase() : execOffice.level.toUpperCase()})`;

    return {
      isAuthorized: true,
      office: execOffice,
      jurisdictionScopeIds,
      departmentScope,
      scopeDescription,
    };
  }

  /**
   * Suppresses numbers < 5 for privacy protection (Rule 7: DPDP Act Privacy Rule)
   */
  private static sanitizeCount(count: number): string | number {
    if (count > 0 && count < 5) {
      return '<5';
    }
    return count;
  }

  /**
   * Executive Dashboard Data Aggregation (/office-portal/analysis)
   */
  static async getExecutiveDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scope = await AnalysisController.resolveExecutiveScope(req.user);
      if (!scope.isAuthorized) {
        res.status(403).json({
          success: false,
          message: 'Executive analysis is strictly restricted to ministries, executive offices (CM/PM), district/state administrative offices, and administrators.',
        });
        return;
      }

      // Build base query strictly enforced by server scope
      const baseQuery: any = { status: { $ne: 'draft' } };

      if (scope.jurisdictionScopeIds.length > 0) {
        baseQuery.jurisdictionIds = { $in: scope.jurisdictionScopeIds };
      }
      if (scope.departmentScope.length > 0) {
        baseQuery.category = { $in: scope.departmentScope };
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      // Fetch scoped issues
      const issues = await Issue.find(baseQuery).select(
        'category status escalationLevel slaDeadline resolvedAt confirmedByCount disputedByCount thanksCount createdAt jurisdictionIds'
      );

      const totalScopedIssues = issues.length;

      // 1. Cross-Constituency Comparison
      // Identify constituencies within jurisdiction scope or all relevant constituencies
      const jurQuery: any = {
        level: { $in: ['assembly_constituency', 'parliamentary_constituency', 'ward'] },
      };
      if (scope.jurisdictionScopeIds.length > 0) {
        jurQuery._id = { $in: scope.jurisdictionScopeIds };
      }

      const relevantConstituencies = await Jurisdiction.find(jurQuery).select('name code level');

      const constituencyBreakdown = relevantConstituencies.map((constituency) => {
        const cIssues = issues.filter(
          (i) => i.jurisdictionIds && i.jurisdictionIds.some((jid) => jid.toString() === constituency._id.toString())
        );

        const intake = cIssues.length;
        const resolved = cIssues.filter((i) => i.status === 'resolved').length;
        const overdue = cIssues.filter(
          (i) => Boolean(i.slaDeadline && i.slaDeadline < now && i.status !== 'resolved')
        ).length;
        const confirmedCredit = cIssues.reduce((sum, i) => sum + (i.confirmedByCount || 0), 0);

        const resolutionRate = intake >= 10 ? Math.round((resolved / intake) * 100) : null;

        return {
          id: constituency._id,
          name: constituency.name,
          code: constituency.code,
          level: constituency.level,
          intake: AnalysisController.sanitizeCount(intake),
          resolved: AnalysisController.sanitizeCount(resolved),
          overdue: AnalysisController.sanitizeCount(overdue),
          confirmedCredit: AnalysisController.sanitizeCount(confirmedCredit),
          resolutionRate: resolutionRate !== null ? `${resolutionRate}%` : (intake < 10 ? 'Sample <10' : '0%'),
        };
      });

      // 2. Departmental Bottleneck Analysis
      const categories = ['roads', 'water', 'sanitation', 'health', 'electricity', 'education', 'general'];
      const filteredCategories = scope.departmentScope.length > 0
        ? categories.filter((c) => scope.departmentScope.includes(c))
        : categories;

      const departmentalBottlenecks = filteredCategories.map((category) => {
        const catIssues = issues.filter((i) => i.category === category);
        const resolvedIssues = catIssues.filter((i) => i.status === 'resolved' && i.resolvedAt);

        // Average resolution hours
        let avgResolutionHours: number | null = null;
        if (resolvedIssues.length >= 5) {
          const totalHours = resolvedIssues.reduce(
            (acc, i) => acc + (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60),
            0
          );
          avgResolutionHours = Math.round((totalHours / resolvedIssues.length) * 10) / 10;
        }

        const escalationCount = catIssues.filter((i) => (i.escalationLevel || 0) > 0).length;
        const disputeCount = catIssues.filter((i) => (i.disputedByCount || 0) > 0).length;
        const disputeRate = resolvedIssues.length >= 10
          ? `${Math.round((disputeCount / resolvedIssues.length) * 100)}%`
          : (resolvedIssues.length < 10 ? 'Sample <10' : '0%');

        return {
          category,
          totalIssues: AnalysisController.sanitizeCount(catIssues.length),
          avgResolutionHours: avgResolutionHours !== null ? `${avgResolutionHours}h` : '—',
          escalationCount: AnalysisController.sanitizeCount(escalationCount),
          disputeCount: AnalysisController.sanitizeCount(disputeCount),
          disputeRate,
        };
      });

      // 3. Recurring / Hot-Spot Issue Clusters (Surging Volume 30d vs Prior 30d)
      const hotSpotClusters = filteredCategories.map((category) => {
        const current30d = issues.filter(
          (i) => i.category === category && i.createdAt >= thirtyDaysAgo && i.createdAt <= now
        ).length;
        const prior30d = issues.filter(
          (i) => i.category === category && i.createdAt >= sixtyDaysAgo && i.createdAt < thirtyDaysAgo
        ).length;

        let surgePercent = 0;
        if (prior30d > 0) {
          surgePercent = Math.round(((current30d - prior30d) / prior30d) * 100);
        } else if (current30d >= 5) {
          surgePercent = 100;
        }

        const isSurging = surgePercent >= 20 && current30d >= 5;

        return {
          category,
          currentVolume: AnalysisController.sanitizeCount(current30d),
          priorVolume: AnalysisController.sanitizeCount(prior30d),
          surgePercent: `${surgePercent > 0 ? '+' : ''}${surgePercent}%`,
          isSurging,
        };
      });

      // 4. SLA Escalation Health
      const l1Breaches = issues.filter((i) => (i.escalationLevel || 0) >= 1).length;
      const l2Breaches = issues.filter((i) => (i.escalationLevel || 0) >= 2).length;
      const l3Breaches = issues.filter((i) => (i.escalationLevel || 0) >= 3).length;

      const slaHealth = {
        totalIssues: AnalysisController.sanitizeCount(totalScopedIssues),
        escalatedToL1: AnalysisController.sanitizeCount(l1Breaches),
        escalatedToL1Rate: totalScopedIssues >= 10 ? `${Math.round((l1Breaches / totalScopedIssues) * 100)}%` : '—',
        escalatedToL2: AnalysisController.sanitizeCount(l2Breaches),
        escalatedToL2Rate: totalScopedIssues >= 10 ? `${Math.round((l2Breaches / totalScopedIssues) * 100)}%` : '—',
        escalatedToL3: AnalysisController.sanitizeCount(l3Breaches),
        escalatedToL3Rate: totalScopedIssues >= 10 ? `${Math.round((l3Breaches / totalScopedIssues) * 100)}%` : '—',
      };

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'executive_analysis_viewed',
        targetType: 'office',
        details: {
          scope: scope.scopeDescription,
          totalScopedIssues,
        },
      });

      res.json({
        success: true,
        scope: {
          scopeDescription: scope.scopeDescription,
          jurisdictionCount: scope.jurisdictionScopeIds.length,
          departments: scope.departmentScope,
          privacyShieldEnforced: true,
          privacyNotice: 'Aggregated numbers only. Cell values below 5 are suppressed (<5) to ensure DPDP Act re-identification protection.',
        },
        constituencyBreakdown,
        departmentalBottlenecks,
        hotSpotClusters,
        slaHealth,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export Executive Briefing CSV with Privacy Protections (<5 Suppression)
   */
  static async exportAnalysisCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scope = await AnalysisController.resolveExecutiveScope(req.user);
      if (!scope.isAuthorized) {
        res.status(403).json({ success: false, message: 'Unauthorized for executive CSV export.' });
        return;
      }

      const baseQuery: any = { status: { $ne: 'draft' } };
      if (scope.jurisdictionScopeIds.length > 0) {
        baseQuery.jurisdictionIds = { $in: scope.jurisdictionScopeIds };
      }
      if (scope.departmentScope.length > 0) {
        baseQuery.category = { $in: scope.departmentScope };
      }

      const now = new Date();
      const issues = await Issue.find(baseQuery);

      let csv = `RAISE Executive Analysis Briefing (${scope.scopeDescription})\n`;
      csv += `Generated At: ${now.toISOString()}\n`;
      csv += `Privacy Shield: DPDP Act Enforced (All counts <5 suppressed to "<5")\n\n`;

      csv += `--- CROSS-CONSTITUENCY BREAKDOWN ---\n`;
      csv += `Constituency / Ward,Level,Intake,Resolved,Overdue,Confirmed Credit,Resolution Rate\n`;

      const jurQuery: any = {
        level: { $in: ['assembly_constituency', 'parliamentary_constituency', 'ward'] },
      };
      if (scope.jurisdictionScopeIds.length > 0) {
        jurQuery._id = { $in: scope.jurisdictionScopeIds };
      }
      const relevantConstituencies = await Jurisdiction.find(jurQuery);

      for (const constituency of relevantConstituencies) {
        const cIssues = issues.filter(
          (i) => i.jurisdictionIds && i.jurisdictionIds.some((jid) => jid.toString() === constituency._id.toString())
        );
        const intake = cIssues.length;
        const resolved = cIssues.filter((i) => i.status === 'resolved').length;
        const overdue = cIssues.filter(
          (i) => Boolean(i.slaDeadline && i.slaDeadline < now && i.status !== 'resolved')
        ).length;
        const confirmedCredit = cIssues.reduce((sum, i) => sum + (i.confirmedByCount || 0), 0);
        const resolutionRate = intake >= 10 ? `${Math.round((resolved / intake) * 100)}%` : 'Sample <10';

        csv += `"${constituency.name}","${constituency.level}",${AnalysisController.sanitizeCount(intake)},${AnalysisController.sanitizeCount(resolved)},${AnalysisController.sanitizeCount(overdue)},${AnalysisController.sanitizeCount(confirmedCredit)},${resolutionRate}\n`;
      }

      csv += `\n--- DEPARTMENTAL BOTTLENECK ANALYSIS ---\n`;
      csv += `Category,Total Issues,Avg Resolution Time,Escalations,Dispute Count,Dispute Rate\n`;

      const categories = ['roads', 'water', 'sanitation', 'health', 'electricity', 'education', 'general'];
      for (const cat of categories) {
        const catIssues = issues.filter((i) => i.category === cat);
        const resolved = catIssues.filter((i) => i.status === 'resolved' && i.resolvedAt);
        let avgHours = '—';
        if (resolved.length >= 5) {
          const totalHours = resolved.reduce(
            (acc, i) => acc + (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60),
            0
          );
          avgHours = `${Math.round((totalHours / resolved.length) * 10) / 10}h`;
        }
        const escalations = catIssues.filter((i) => (i.escalationLevel || 0) > 0).length;
        const disputes = catIssues.filter((i) => (i.disputedByCount || 0) > 0).length;
        const disputeRate = resolved.length >= 10 ? `${Math.round((disputes / resolved.length) * 100)}%` : 'Sample <10';

        csv += `"${cat}",${AnalysisController.sanitizeCount(catIssues.length)},${avgHours},${AnalysisController.sanitizeCount(escalations)},${AnalysisController.sanitizeCount(disputes)},${disputeRate}\n`;
      }

      await AuditService.log({
        actorId: req.user!.userId,
        actorRole: req.user!.role,
        action: 'executive_analysis_exported',
        targetType: 'office',
        details: { scope: scope.scopeDescription },
      });

      const today = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="raise-executive-briefing-${today}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
