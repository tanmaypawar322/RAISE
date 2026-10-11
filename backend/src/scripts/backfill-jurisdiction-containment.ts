import { connectDB } from '../config/db.js';
import { Issue } from '../models/Issue.js';
import { Jurisdiction } from '../models/Jurisdiction.js';

export async function backfillJurisdictionContainment(): Promise<{ updated: number; total: number }> {
  console.log('[MIGRATION] Starting idempotent jurisdiction containment backfill...');
  await connectDB();

  const issues = await Issue.find({});
  let updatedCount = 0;

  for (const issue of issues) {
    const coords = issue.location?.coordinates;
    let jurisdictionIds: any[] = [];

    if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      const matched = await Jurisdiction.find({
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: [coords[0], coords[1]],
            },
          },
        },
        active: true,
      }).select('_id');

      jurisdictionIds = matched.map((j) => j._id);
    }

    // Fallback: if no polygon matched or no coordinates, include existing issue.jurisdictionId
    if (issue.jurisdictionId && !jurisdictionIds.some((id) => id.toString() === issue.jurisdictionId?.toString())) {
      jurisdictionIds.push(issue.jurisdictionId);
    }

    // Also look up jurisdiction by ward name if jurisdictionIds is still empty
    if (jurisdictionIds.length === 0 && issue.location?.ward) {
      const wardMatch = await Jurisdiction.findOne({
        name: { $regex: issue.location.ward, $options: 'i' },
      }).select('_id');
      if (wardMatch) jurisdictionIds.push(wardMatch._id);
    }

    issue.jurisdictionIds = jurisdictionIds;
    await issue.save();
    updatedCount++;
  }

  console.log(`[MIGRATION] Successfully backfilled ${updatedCount}/${issues.length} issues.`);
  return { updated: updatedCount, total: issues.length };
}

// Direct execution CLI support
if (process.argv[1]?.endsWith('backfill-jurisdiction-containment.ts') || process.argv[1]?.endsWith('backfill-jurisdiction-containment.js')) {
  backfillJurisdictionContainment()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[MIGRATION-ERROR]', err);
      process.exit(1);
    });
}
