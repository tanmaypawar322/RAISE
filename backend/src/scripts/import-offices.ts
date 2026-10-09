import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Office } from '../models/Office.js';
import { Jurisdiction } from '../models/Jurisdiction.js';

interface OfficeRow {
  name: string;
  nameMr?: string;
  nameHi?: string;
  level: 'gram_panchayat' | 'ward' | 'taluka' | 'corporation' | 'district' | 'state';
  department: 'roads' | 'water' | 'sanitation' | 'health' | 'education' | 'electricity' | 'general';
  jurisdictionName?: string;
  supportedCategories: string[];
  slaHours: Record<string, number>;
  officialEmail?: string;
  escalatesToOfficeName?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function run() {
  const args = process.argv.slice(2);
  let filePath = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1];
      break;
    }
  }

  if (!filePath) {
    filePath = path.resolve(process.cwd(), '../docs/offices-template.csv');
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), 'docs/offices-template.csv');
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error(`[IMPORT-OFFICES] Error: CSV file not found at ${filePath}`);
    process.exit(1);
  }

  console.log(`[IMPORT-OFFICES] Reading offices from: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error('[IMPORT-OFFICES] Error: CSV file must contain a header and at least one data row.');
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const rows: OfficeRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 5) continue;

    const rowObj: any = {};
    header.forEach((key, idx) => {
      rowObj[key] = cols[idx] || '';
    });

    const supportedCategories = rowObj.supportedCategories
      ? rowObj.supportedCategories.split(',').map((c: string) => c.trim().toLowerCase()).filter(Boolean)
      : [rowObj.department || 'general'];

    const slaHours: Record<string, number> = {
      default: parseInt(rowObj.slaHoursDefault || '48', 10),
    };
    if (rowObj.slaHoursRoads) slaHours.roads = parseInt(rowObj.slaHoursRoads, 10);
    if (rowObj.slaHoursWater) slaHours.water = parseInt(rowObj.slaHoursWater, 10);
    if (rowObj.slaHoursSanitation) slaHours.sanitation = parseInt(rowObj.slaHoursSanitation, 10);

    rows.push({
      name: rowObj.name,
      nameMr: rowObj.nameMr,
      nameHi: rowObj.nameHi,
      level: rowObj.level || 'ward',
      department: rowObj.department || 'general',
      jurisdictionName: rowObj.jurisdictionName,
      supportedCategories,
      slaHours,
      officialEmail: rowObj.officialEmail,
      escalatesToOfficeName: rowObj.escalatesToOfficeName,
    });
  }

  await connectDB();
  console.log(`[IMPORT-OFFICES] Processing ${rows.length} offices...`);

  const createdOffices = new Map<string, mongoose.Types.ObjectId>();

  // Pass 1: Upsert each office
  for (const row of rows) {
    let jurisdictionId: mongoose.Types.ObjectId | undefined;
    if (row.jurisdictionName) {
      const jur = await Jurisdiction.findOne({ name: row.jurisdictionName });
      if (jur) {
        jurisdictionId = jur._id as mongoose.Types.ObjectId;
      } else {
        console.warn(`  Warning: Jurisdiction "${row.jurisdictionName}" not found in database for office "${row.name}".`);
      }
    }

    const doc = await Office.findOneAndUpdate(
      { name: row.name },
      {
        $set: {
          name: row.name,
          nameMr: row.nameMr,
          nameHi: row.nameHi,
          level: row.level,
          department: row.department,
          jurisdictionId,
          supportedCategories: row.supportedCategories,
          slaHours: row.slaHours,
          officialEmail: row.officialEmail,
          claimStatus: row.officialEmail ? 'claimed' : 'unclaimed',
        },
      },
      { upsert: true, new: true }
    );

    createdOffices.set(row.name, doc._id as mongoose.Types.ObjectId);
    console.log(`  ✓ Upserted office: "${row.name}" [ID: ${doc._id}]`);
  }

  // Pass 2: Link escalation hierarchy
  for (const row of rows) {
    if (row.escalatesToOfficeName && createdOffices.has(row.escalatesToOfficeName)) {
      const targetOfficeId = createdOffices.get(row.escalatesToOfficeName);
      await Office.updateOne({ name: row.name }, { $set: { escalatesToOfficeId: targetOfficeId } });
      console.log(`  Linked "${row.name}" -> Escalates to "${row.escalatesToOfficeName}"`);
    }
  }

  console.log(`[IMPORT-OFFICES] Successfully imported ${rows.length} offices.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[IMPORT-OFFICES] Fatal Error:', err);
  process.exit(1);
});
