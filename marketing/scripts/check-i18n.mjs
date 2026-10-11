import { en } from '../content/i18n/en.ts';
import { mr } from '../content/i18n/mr.ts';
import { hi } from '../content/i18n/hi.ts';

console.log('\n======================================================');
console.log('🌐 RAISE Marketing i18n Completeness Audit');
console.log('======================================================\n');

const languages = [
  { code: 'en', dict: en },
  { code: 'mr', dict: mr },
  { code: 'hi', dict: hi },
];

let errors = [];

function checkKeys(base, target, path = '', targetCode = '') {
  for (const key of Object.keys(base)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in target)) {
      errors.push(`[MISSING_KEY] Language "${targetCode}" is missing key: ${currentPath}`);
      continue;
    }

    const baseVal = base[key];
    const targetVal = target[key];

    if (typeof baseVal === 'object' && baseVal !== null && !Array.isArray(baseVal)) {
      if (typeof targetVal !== 'object' || targetVal === null || Array.isArray(targetVal)) {
        errors.push(`[TYPE_MISMATCH] "${targetCode}" key ${currentPath} should be an object`);
      } else {
        checkKeys(baseVal, targetVal, currentPath, targetCode);
      }
    } else if (Array.isArray(baseVal)) {
      if (!Array.isArray(targetVal)) {
        errors.push(`[TYPE_MISMATCH] "${targetCode}" key ${currentPath} should be an array`);
      } else if (targetVal.length === 0) {
        errors.push(`[EMPTY_ARRAY] "${targetCode}" key ${currentPath} has empty array`);
      }
    } else if (typeof targetVal === 'string') {
      if (!targetVal.trim()) {
        errors.push(`[EMPTY_STRING] "${targetCode}" key ${currentPath} is empty`);
      }
    }
  }
}

// Compare en against mr and hi
checkKeys(en, mr, '', 'mr');
checkKeys(en, hi, '', 'hi');

// Check that English has no Devanagari characters
function checkDevanagariInEnglish(obj, path = '') {
  const devanagariRegex = /[\u0900-\u097F]/;
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof val === 'string' && devanagariRegex.test(val)) {
      errors.push(`[DEV_IN_EN] English string at "${currentPath}" contains Devanagari text: "${val}"`);
    } else if (typeof val === 'object' && val !== null) {
      checkDevanagariInEnglish(val, currentPath);
    }
  }
}
checkDevanagariInEnglish(en);

if (errors.length > 0) {
  console.error(`❌ Found ${errors.length} i18n completeness issues:\n`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`✅ All translation keys exist across en, mr, and hi with zero empty strings.`);
  console.log(`✅ Zero Devanagari in English file.\n`);
  process.exit(0);
}
