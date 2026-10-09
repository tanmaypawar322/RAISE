import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Jurisdiction, IJurisdiction } from '../models/Jurisdiction.js';

interface GeoJsonFeature {
  type: string;
  properties: {
    name: string;
    nameMr?: string;
    nameHi?: string;
    code?: string;
    type: 'ward' | 'prabhag' | 'zone' | 'hq';
    parentName?: string;
    slaHoursDefault?: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
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
    filePath = path.resolve(process.cwd(), '../docs/pilot-ward-boundary.geojson');
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), 'docs/pilot-ward-boundary.geojson');
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error(`[IMPORT-JURISDICTIONS] Error: GeoJSON file not found at ${filePath}`);
    process.exit(1);
  }

  console.log(`[IMPORT-JURISDICTIONS] Reading boundaries from: ${filePath}`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(rawData);

  const features: GeoJsonFeature[] = parsed.type === 'FeatureCollection' ? parsed.features : [parsed];
  if (!features || features.length === 0) {
    console.error('[IMPORT-JURISDICTIONS] Error: No GeoJSON features detected.');
    process.exit(1);
  }

  await connectDB();

  console.log(`[IMPORT-JURISDICTIONS] Processing ${features.length} jurisdiction boundaries...`);

  const createdMap = new Map<string, mongoose.Types.ObjectId>();

  // First pass: upsert each jurisdiction
  for (const feat of features) {
    const props = feat.properties;
    const boundary = feat.geometry;

    if (!props.name || !boundary) {
      console.warn(`[IMPORT-JURISDICTIONS] Skipping invalid feature without name or geometry.`);
      continue;
    }

    const doc = await Jurisdiction.findOneAndUpdate(
      { name: props.name },
      {
        $set: {
          name: props.name,
          nameMr: props.nameMr,
          nameHi: props.nameHi,
          code: props.code,
          type: props.type || 'ward',
          boundary,
          slaHoursDefault: props.slaHoursDefault || 48,
          active: true,
        },
      },
      { upsert: true, new: true }
    );

    createdMap.set(props.name, doc._id as mongoose.Types.ObjectId);
    console.log(`  ✓ Upserted jurisdiction: "${props.name}" (${props.type}) [ID: ${doc._id}]`);
  }

  // Second pass: link parent jurisdictions if parentName is specified
  for (const feat of features) {
    const props = feat.properties;
    if (props.parentName && createdMap.has(props.parentName)) {
      const parentId = createdMap.get(props.parentName);
      await Jurisdiction.updateOne({ name: props.name }, { $set: { parentJurisdictionId: parentId } });
      console.log(`  Linked "${props.name}" -> parent "${props.parentName}"`);
    }
  }

  console.log(`[IMPORT-JURISDICTIONS] Successfully imported ${features.length} jurisdictions.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[IMPORT-JURISDICTIONS] Fatal Error:', err);
  process.exit(1);
});
