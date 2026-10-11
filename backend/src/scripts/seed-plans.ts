import { Plan } from '../models/Plan.js';

export const DEFAULT_PLANS = [
  {
    key: 'citizen',
    name: 'Citizen (नागरिक)',
    nameMr: 'नागरिक',
    nameHi: 'नागरिक',
    description: 'Always 100% free forever for all citizens.',
    descriptionMr: 'सर्व नागरिकांसाठी कायमस्वरूपी मोफत.',
    descriptionHi: 'सभी नागरिकों के लिए हमेशा पूरी तरह से मुफ्त.',
    priceMonthlyPaise: 0,
    priceYearlyPaise: 0,
    features: [
      'public_reporting',
      'amplify_issues',
      'track_status',
      'escalation_drafts',
      'comments',
      'citizen_dashboard',
    ],
    limits: { seats: 1, exportsPerMonth: 5, notificationCredits: 50 },
    isActive: true,
    sortOrder: 1,
  },
  {
    key: 'office_basic',
    name: 'Office Basic (मूलभूत कार्यालय)',
    nameMr: 'मूलभूत कार्यालय',
    nameHi: 'मूल कार्यालय',
    description: 'Free civic response tier for all government and ward offices.',
    descriptionMr: 'सर्व प्रशासकीय आणि प्रभाग कार्यालयांसाठी विनामूल्य प्रतिसाद साधन.',
    descriptionHi: 'सभी प्रशासनिक और वार्ड कार्यालयों के लिए मुफ्त उत्तर साधन.',
    priceMonthlyPaise: 0,
    priceYearlyPaise: 0,
    features: [
      'public_reporting',
      'claim_profile',
      'respond_issues',
      'update_status',
      'public_notes',
      'publish_reports',
      'export_own_data', // Rule 4: Always free
    ],
    limits: { seats: 5, exportsPerMonth: 10, notificationCredits: 100 },
    isActive: true,
    sortOrder: 2,
  },
  {
    key: 'office_pro',
    name: 'Office Pro (प्रगत कार्यालय)',
    nameMr: 'प्रगत कार्यालय (Office Pro)',
    nameHi: 'उन्नत कार्यालय (Office Pro)',
    description: 'Advanced team workflow, assignment, SLA automation, and analytics.',
    descriptionMr: 'प्रगत कार्यप्रवाह, कर्मचारी वाटप, एसएलए स्वयंचलित सूचना आणि विश्लेषण.',
    descriptionHi: 'उन्नत कार्यप्रवाह, कार्य आवंटन, एसएलए स्वचालन और विश्लेषण.',
    priceMonthlyPaise: 499900, // ₹4,999/mo placeholder
    priceYearlyPaise: 4999000, // ₹49,990/yr placeholder
    features: [
      'public_reporting',
      'claim_profile',
      'respond_issues',
      'update_status',
      'public_notes',
      'publish_reports',
      'export_own_data',
      'team_seats',
      'assignment_workflow',
      'sla_automation',
      'analytics_dashboard',
      'bulk_export',
      'notification_credits',
      'custom_categories',
    ],
    limits: { seats: 25, exportsPerMonth: 500, notificationCredits: 2000 },
    isActive: true,
    sortOrder: 3,
  },
  {
    key: 'agency',
    name: 'Agency Partner (कंत्राटदार / एजन्सी)',
    nameMr: 'एजन्सी / कंत्राटदार भागीदार',
    nameHi: 'एजेंसी / ठेकेदार भागीदार',
    description: 'Work order dispatch, proof-of-work uploads, and contractor dashboards.',
    descriptionMr: 'कामवाटप, कामाचा फोटो पुरावा आणि कंत्राटदार डॅशबोर्ड.',
    descriptionHi: 'कार्य आदेश, कार्य प्रमाण और ठेकेदार डैशबोर्ड.',
    priceMonthlyPaise: 299900, // ₹2,999/mo placeholder
    priceYearlyPaise: 2999000, // ₹29,990/yr placeholder
    features: [
      'public_reporting',
      'claim_profile',
      'respond_issues',
      'update_status',
      'public_notes',
      'publish_reports',
      'export_own_data',
      'work_orders',
      'proof_of_work_upload',
      'assigned_issues_dashboard',
    ],
    limits: { seats: 15, exportsPerMonth: 100, notificationCredits: 500 },
    isActive: true,
    sortOrder: 4,
  },
  {
    key: 'institution',
    name: 'Institution & Research (संशोधन व संस्था)',
    nameMr: 'संशोधन व संस्था',
    nameHi: 'अनुसंधान और संस्थान',
    description: 'Anonymized civic trends, research data access, and analytical reports.',
    descriptionMr: 'निनावी नागरी कल, संशोधन डेटा आणि विश्लेषण अहवाल.',
    descriptionHi: 'गुमनाम नागरिक रुझान, अनुसंधान डेटा और विश्लेषणात्मक रिपोर्ट.',
    priceMonthlyPaise: 999900, // ₹9,999/mo placeholder
    priceYearlyPaise: 9999000, // ₹99,990/yr placeholder
    features: [
      'public_reporting',
      'trend_reports',
      'aggregated_data_access',
      'api_access',
      'bulk_export',
    ],
    limits: { seats: 10, exportsPerMonth: 1000, notificationCredits: 100 },
    isActive: true,
    sortOrder: 5,
  },
];

export async function seedPlans(): Promise<void> {
  for (const planData of DEFAULT_PLANS) {
    await Plan.findOneAndUpdate(
      { key: planData.key },
      { $set: planData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}
