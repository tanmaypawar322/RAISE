import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import { Office } from '../models/Office.js';
import { RepresentativeProfile, RepresentativeRole } from '../models/RepresentativeProfile.js';
import { OutreachRecord } from '../models/OutreachRecord.js';

interface CsvRow {
  displayName: string;
  role: RepresentativeRole;
  titleText: string;
  jurisdictionCode: string;
  termStart: string;
  termEnd: string;
  officialSiteUrl?: string;
  line: number;
}

const VALID_ROLES = [
  'ward_councillor',
  'sarpanch',
  'mla',
  'mlc',
  'mp_lok_sabha',
  'mp_rajya_sabha',
  'minister',
  'chief_minister',
  'prime_minister',
  'other',
];

export async function importRepresentatives(
  csvFilePath: string,
  dryRun: boolean = false
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found at: ${csvFilePath}`);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must contain a header and at least one data row.');
  }

  const header = lines[0].split(',').map((h) => h.trim());
  const requiredHeaders = ['displayName', 'role', 'titleText', 'jurisdictionCode', 'termStart', 'termEnd'];

  for (const reqH of requiredHeaders) {
    if (!header.includes(reqH)) {
      throw new Error(`Missing required CSV header column: "${reqH}"`);
    }
  }

  const rows: CsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < requiredHeaders.length) {
      errors.push(`Line ${i + 1}: Insufficient columns`);
      continue;
    }

    const rowObj: any = { line: i + 1 };
    header.forEach((h, idx) => {
      rowObj[h] = cols[idx] || '';
    });

    if (!rowObj.displayName) errors.push(`Line ${i + 1}: Missing displayName`);
    if (!VALID_ROLES.includes(rowObj.role)) {
      errors.push(`Line ${i + 1}: Invalid role "${rowObj.role}". Allowed: ${VALID_ROLES.join(', ')}`);
    }
    if (!rowObj.titleText) errors.push(`Line ${i + 1}: Missing titleText`);
    if (!rowObj.jurisdictionCode) errors.push(`Line ${i + 1}: Missing jurisdictionCode`);

    const start = new Date(rowObj.termStart);
    const end = new Date(rowObj.termEnd);
    if (isNaN(start.getTime())) errors.push(`Line ${i + 1}: Invalid termStart date: "${rowObj.termStart}"`);
    if (isNaN(end.getTime())) errors.push(`Line ${i + 1}: Invalid termEnd date: "${rowObj.termEnd}"`);
    if (end <= start) errors.push(`Line ${i + 1}: termEnd must be after termStart`);

    rows.push(rowObj);
  }

  if (errors.length > 0) {
    console.error(`[IMPORT-REPRESENTATIVES] Validation failed with ${errors.length} errors:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    if (!dryRun) {
      return { successCount: 0, errorCount: errors.length, errors };
    }
  }

  await connectDB();
  console.log(`[IMPORT-REPRESENTATIVES] Processing ${rows.length} rows (dryRun = ${dryRun})...`);

  let successCount = 0;

  for (const r of rows) {
    try {
      // Find jurisdiction by code or name
      let jur = await Jurisdiction.findOne({
        $or: [
          { code: r.jurisdictionCode },
          { name: { $regex: r.jurisdictionCode, $options: 'i' } },
        ],
      });

      if (!jur) {
        // Create stub jurisdiction if not found (especially in pilot/dev mode)
        jur = await Jurisdiction.create({
          name: `Constituency ${r.jurisdictionCode}`,
          code: r.jurisdictionCode,
          type: r.role === 'mla' ? 'assembly_constituency' : r.role === 'mp_lok_sabha' ? 'parliamentary_constituency' : 'ward',
          level: r.role === 'mla' ? 'assembly_constituency' : r.role === 'mp_lok_sabha' ? 'parliamentary_constituency' : 'ward',
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [73.7, 18.6],
                [73.9, 18.6],
                [73.9, 18.8],
                [73.7, 18.8],
                [73.7, 18.6],
              ],
            ],
          },
          slaHoursDefault: 72,
          active: true,
        });
      }

      if (dryRun) {
        console.log(`[DRY-RUN] Valid representative: ${r.displayName} (${r.role}) in ${jur.name}`);
        successCount++;
        continue;
      }

      // Create or find Representative Office
      let office = await Office.findOne({
        name: `Office of ${r.titleText}`,
        kind: 'representative_office',
      });

      if (!office) {
        office = await Office.create({
          name: `Office of ${r.titleText}`,
          kind: 'representative_office',
          level: r.role === 'mp_lok_sabha' ? 'district' : r.role === 'mla' ? 'corporation' : 'ward',
          department: 'general',
          jurisdictionId: jur._id,
          jurisdiction: {
            ward: jur.name,
            city: 'Pimpri-Chinchwad',
            district: 'Pune',
            state: 'Maharashtra',
          },
          claimStatus: 'unclaimed',
        });
      }

      // Upsert Representative Profile
      let profile = await RepresentativeProfile.findOne({
        jurisdictionId: jur._id,
        role: r.role,
        termStart: new Date(r.termStart),
      });

      if (!profile) {
        profile = await RepresentativeProfile.create({
          officeId: office._id,
          role: r.role,
          titleText: r.titleText,
          jurisdictionId: jur._id,
          termStart: new Date(r.termStart),
          termEnd: new Date(r.termEnd),
          status: 'unclaimed',
          displayName: r.displayName,
          officialSiteUrl: r.officialSiteUrl || undefined,
        });
      } else {
        profile.displayName = r.displayName;
        profile.titleText = r.titleText;
        profile.termEnd = new Date(r.termEnd);
        profile.officialSiteUrl = r.officialSiteUrl || profile.officialSiteUrl;
        await profile.save();
      }

      // Upsert Outreach Record for admin queue
      await OutreachRecord.findOneAndUpdate(
        { targetType: 'representative', targetId: profile._id },
        {
          $setOnInsert: {
            targetType: 'representative',
            targetId: profile._id,
            status: 'not_contacted',
            notes: `Imported from CSV for ${r.titleText}`,
          },
        },
        { upsert: true }
      );

      successCount++;
    } catch (err: any) {
      errors.push(`Line ${r.line}: Failed to import: ${err.message}`);
    }
  }

  console.log(`[IMPORT-REPRESENTATIVES] Done. Success: ${successCount}, Errors: ${errors.length}`);
  return { successCount, errorCount: errors.length, errors };
}

// CLI runner
if (process.argv[1]?.endsWith('import-representatives.ts') || process.argv[1]?.endsWith('import-representatives.js')) {
  const args = process.argv.slice(2);
  let csvPath = '';
  let isDryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      isDryRun = true;
    } else if (!csvPath && !args[i].startsWith('--')) {
      csvPath = args[i];
    }
  }

  if (!csvPath) {
    csvPath = path.resolve(process.cwd(), 'data/templates/representatives.sample.csv');
  }

  importRepresentatives(csvPath, isDryRun)
    .then((res) => {
      if (res.errorCount > 0 && res.successCount === 0) process.exit(1);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[FATAL]', err);
      process.exit(1);
    });
}
