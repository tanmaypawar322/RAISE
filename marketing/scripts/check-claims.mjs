import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read claims.ts directly to extract entries
const claimsFilePath = path.join(rootDir, 'content', 'claims.ts');
if (!fs.existsSync(claimsFilePath)) {
  console.error('❌ claims.ts file not found at:', claimsFilePath);
  process.exit(1);
}

const claimsContent = fs.readFileSync(claimsFilePath, 'utf8');

// Parse claim entries using regex for fast standalone Node execution
const claimRegex = /(\w+):\s*\{\s*id:\s*['"](\w+)['"],[\s\S]*?verified:\s*(true|false),[\s\S]*?notes:\s*['"](.*?)['"],?\s*\}/g;
const claims = [];
let match;

while ((match = claimRegex.exec(claimsContent)) !== null) {
  claims.push({
    key: match[1],
    id: match[2],
    verified: match[3] === 'true',
    notes: match[4],
  });
}

console.log(`\n======================================================`);
console.log(`📋 RAISE Marketing Claims Audit (check:claims)`);
console.log(`======================================================\n`);
console.log(`Found ${claims.length} registered claims in content/claims.ts:\n`);

let unverifiedCount = 0;
let verifiedCount = 0;

claims.forEach((c) => {
  if (c.verified) {
    verifiedCount++;
    console.log(`  [VERIFIED]   ${c.id}`);
  } else {
    unverifiedCount++;
    console.log(`  [UNVERIFIED] ${c.id} - Notes: ${c.notes}`);
  }
});

console.log(`\nSummary: ${verifiedCount} Verified, ${unverifiedCount} Unverified claims.`);

// Scan source files for <Claim ... /> usages
const srcDir = path.join(rootDir, 'src');
let violations = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const code = fs.readFileSync(fullPath, 'utf8');
      
      // Match <Claim id="..." ... />
      const claimTagRegex = /<Claim\s+([^>]*?)\/?>/g;
      let tagMatch;
      while ((tagMatch = claimTagRegex.exec(code)) !== null) {
        const attributes = tagMatch[1];
        const idMatch = /id=['"]([^'"]+)['"]/.exec(attributes);
        const hasFallback = /fallback=/.test(attributes);

        if (idMatch) {
          const claimId = idMatch[1];
          const matchedClaim = claims.find((c) => c.id === claimId);

          if (!matchedClaim) {
            violations.push({
              file: path.relative(rootDir, fullPath),
              type: 'UNKNOWN_CLAIM',
              message: `References unregistered claim id="${claimId}"`,
            });
          } else if (!matchedClaim.verified && !hasFallback) {
            violations.push({
              file: path.relative(rootDir, fullPath),
              type: 'UNVERIFIED_WITHOUT_FALLBACK',
              message: `References unverified claim id="${claimId}" without a fallback property`,
            });
          }
        }
      }
    }
  }
}

if (fs.existsSync(srcDir)) {
  scanDir(srcDir);
}

const isStrict = process.env.CLAIMS_STRICT === 'true';

if (violations.length > 0) {
  console.log(`\n⚠️ Found ${violations.length} Claim violations:`);
  violations.forEach((v) => {
    console.log(`  - [${v.type}] ${v.file}: ${v.message}`);
  });

  if (isStrict) {
    console.error(`\n❌ Build failed: CLAIMS_STRICT=true and claim violations are present.\n`);
    process.exit(1);
  } else {
    console.log(`\n(Passes in normal mode; run with CLAIMS_STRICT=true to enforce zero unverified claims without fallbacks)\n`);
  }
} else {
  console.log(`\n✅ All <Claim /> usages are compliant. Zero unverified claims without fallbacks.\n`);
}

process.exit(0);
