import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Office } from '../models/Office.js';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import { config } from '../config/env.js';

const pilotJurisdictions = [
  {
    name: 'PCMC Central Headquarters',
    nameMr: 'पिं.चिं.म.न.पा. मुख्य प्रशासकीय मुख्यालय',
    nameHi: 'पिं.चिं.म.न.पा. मुख्य प्रशासनिक मुख्यालय',
    code: 'PCMC-HQ',
    type: 'hq',
    slaHoursDefault: 96,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.700, 18.580],
          [73.900, 18.580],
          [73.900, 18.720],
          [73.700, 18.720],
          [73.700, 18.580],
        ],
      ],
    },
  },
  {
    name: 'PCMC Zone A (Pradhikaran - Akurdi)',
    nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय कार्यक्षेत्र',
    nameHi: "पिं.चिं.म.न.पा. 'अ' जोनल कार्यालय कार्यक्षेत्र",
    code: 'ZONE-A',
    type: 'zone',
    slaHoursDefault: 72,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.750, 18.630],
          [73.810, 18.630],
          [73.810, 18.690],
          [73.750, 18.690],
          [73.750, 18.630],
        ],
      ],
    },
  },
  {
    name: 'PCMC Ward 12 (Nigdi - Pradhikaran)',
    nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ (निगडी - प्राधिकरण)',
    nameHi: 'पिं.चिं.म.न.पा. वार्ड १२ (निगडी - प्राधिकरण)',
    code: 'WARD-12',
    type: 'ward',
    slaHoursDefault: 48,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [73.765, 18.650],
          [73.795, 18.650],
          [73.795, 18.675],
          [73.765, 18.675],
          [73.765, 18.650],
        ],
      ],
    },
  },
];

const pilotOffices = [
  {
    name: "PCMC Ward 'A' Zonal Office",
    nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय (निगडी, आकुर्डी, प्राधिकरण)',
    level: 'ward',
    department: 'general',
    jurisdiction: {
      ward: 'Ward A',
      city: 'Pimpri-Chinchwad',
      district: 'Pune',
      state: 'Maharashtra',
      location: { type: 'Point', coordinates: [73.7842, 18.6508] },
    },
    claimStatus: 'unclaimed',
    stats: { issuesTotal: 0, issuesAcknowledged: 0, issuesResolved: 0, avgResponseHours: 0 },
  },
  {
    name: 'PCMC Water Supply & Drainage Department',
    nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
    level: 'corporation',
    department: 'water',
    jurisdiction: {
      city: 'Pimpri-Chinchwad',
      district: 'Pune',
      state: 'Maharashtra',
      location: { type: 'Point', coordinates: [73.8016, 18.6277] },
    },
    claimStatus: 'claimed',
    officialEmail: 'officer.water@pcmc.gov.in',
    stats: { issuesTotal: 2, issuesAcknowledged: 1, issuesResolved: 0, avgResponseHours: 12 },
    reports: [
      {
        title: 'Monsoon Pipeline Overhaul and Sump Maintenance',
        period: 'Q3 2026',
        budget: '₹ 45,00,000',
        content: 'Completed inspection of 14km distribution lines in Nigdi and Akurdi. Replaced 3 high-capacity valve fixtures.',
        createdAt: new Date(),
      },
    ],
  },
  {
    name: 'PCMC Road Maintenance & Civil Department',
    nameMr: 'पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग',
    level: 'corporation',
    department: 'roads',
    jurisdiction: {
      city: 'Pimpri-Chinchwad',
      district: 'Pune',
      state: 'Maharashtra',
      location: { type: 'Point', coordinates: [73.8016, 18.6277] },
    },
    claimStatus: 'claimed',
    officialEmail: 'officer.roads@pcmc.gov.in',
    stats: { issuesTotal: 1, issuesAcknowledged: 0, issuesResolved: 0, avgResponseHours: 0 },
    reports: [],
  },
  {
    name: 'PCMC Health & Sanitation Department',
    nameMr: 'पिं.चिं.म.न.पा. मुख्य आरोग्य व घनकचरा व्यवस्थापन विभाग',
    level: 'corporation',
    department: 'sanitation',
    jurisdiction: {
      city: 'Pimpri-Chinchwad',
      district: 'Pune',
      state: 'Maharashtra',
      location: { type: 'Point', coordinates: [73.8016, 18.6277] },
    },
    claimStatus: 'unclaimed',
    stats: { issuesTotal: 1, issuesAcknowledged: 0, issuesResolved: 0, avgResponseHours: 0 },
    reports: [],
  },
  {
    name: 'MSEDCL Pimpri Division (Mahavitaran)',
    nameMr: 'महावितरण पिंपरी विभाग (विद्युत पुरवठा)',
    level: 'district',
    department: 'electricity',
    jurisdiction: {
      city: 'Pimpri-Chinchwad',
      district: 'Pune',
      state: 'Maharashtra',
      location: { type: 'Point', coordinates: [73.8045, 18.6256] },
    },
    claimStatus: 'unclaimed',
    stats: { issuesTotal: 0, issuesAcknowledged: 0, issuesResolved: 0, avgResponseHours: 0 },
    reports: [],
  },
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Seed script cannot run in production mode.');
    process.exit(1);
  }
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    console.error('CRITICAL: ALLOW_DEMO_SEED must be set to "true" to run demo seed script.');
    process.exit(1);
  }

  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);

  // 0. Seed Jurisdictions
  const jurMap: Record<string, any> = {};
  for (const jData of pilotJurisdictions) {
    let jur = await Jurisdiction.findOne({ name: jData.name });
    if (!jur) {
      jur = await Jurisdiction.create(jData);
      console.log(`[Seed] Created jurisdiction: ${jur.name} (${jur.type})`);
    } else {
      console.log(`[Seed] Jurisdiction exists: ${jur.name}`);
    }
    jurMap[jData.code] = jur;
  }
  if (jurMap['ZONE-A'] && jurMap['PCMC-HQ']) {
    await Jurisdiction.updateOne({ code: 'ZONE-A' }, { $set: { parentJurisdictionId: jurMap['PCMC-HQ']._id } });
  }
  if (jurMap['WARD-12'] && jurMap['ZONE-A']) {
    await Jurisdiction.updateOne({ code: 'WARD-12' }, { $set: { parentJurisdictionId: jurMap['ZONE-A']._id } });
  }

  // 1. Seed Offices
  const officeMap: Record<string, any> = {};
  for (const officeData of pilotOffices) {
    let office = await Office.findOne({ name: officeData.name });
    const jurId = officeData.level === 'ward' ? jurMap['ZONE-A']?._id : jurMap['PCMC-HQ']?._id;
    if (!office) {
      office = await Office.create({
        ...officeData,
        jurisdictionId: jurId,
        supportedCategories: [officeData.department, 'general'],
        slaHours: 48,
      });
      console.log(`[Seed] Created office: ${office.name}`);
    } else {
      await Office.updateOne(
        { _id: office._id },
        {
          $set: {
            jurisdictionId: jurId,
            supportedCategories: [officeData.department, 'general'],
            slaHours: 48,
          },
        }
      );
      console.log(`[Seed] Office updated: ${office.name}`);
    }
    officeMap[officeData.department] = office;
  }

  // 2. Seed Demo Accounts
  const defaultAdminPassword = await bcrypt.hash('Admin@123', 10);
  const defaultOfficerPassword = await bcrypt.hash('Officer@123', 10);
  const defaultCitizenPassword = await bcrypt.hash('Citizen@123', 10);

  // Platform Admin
  let admin = await User.findOne({ email: 'admin@raise.org' });
  if (!admin) {
    admin = await User.create({
      name: 'Platform Administrator',
      email: 'admin@raise.org',
      passwordHash: defaultAdminPassword,
      displayName: 'System Admin',
      role: 'admin',
      isOfficialVerified: true,
      language: 'en',
    });
    console.log('[Seed] Created Admin: admin@raise.org (Password: Admin@123)');
  }

  // Official: Water Dept
  let waterOfficer = await User.findOne({ email: 'officer.water@pcmc.gov.in' });
  if (!waterOfficer) {
    waterOfficer = await User.create({
      name: 'Ramesh Patil (Executive Engineer)',
      email: 'officer.water@pcmc.gov.in',
      passwordHash: defaultOfficerPassword,
      displayName: 'PCMC Water Dept Official',
      role: 'official',
      officialOfficeId: officeMap['water']?._id,
      isOfficialVerified: true,
      language: 'mr',
    });
    console.log('[Seed] Created Official: officer.water@pcmc.gov.in (Password: Officer@123)');
    // Link to office
    if (officeMap['water']) {
      await Office.findByIdAndUpdate(officeMap['water']._id, { claimedBy: waterOfficer._id });
    }
  }

  // Official: Roads Dept
  let roadsOfficer = await User.findOne({ email: 'officer.roads@pcmc.gov.in' });
  if (!roadsOfficer) {
    roadsOfficer = await User.create({
      name: 'Suresh Deshmukh (Junior Engineer)',
      email: 'officer.roads@pcmc.gov.in',
      passwordHash: defaultOfficerPassword,
      displayName: 'PCMC Roads Dept Official',
      role: 'official',
      officialOfficeId: officeMap['roads']?._id,
      isOfficialVerified: true,
      language: 'mr',
    });
    console.log('[Seed] Created Official: officer.roads@pcmc.gov.in (Password: Officer@123)');
    if (officeMap['roads']) {
      await Office.findByIdAndUpdate(officeMap['roads']._id, { claimedBy: roadsOfficer._id });
    }
  }

  // Citizen: Aditya Pawar
  let citizen = await User.findOne({ email: 'citizen@example.com' });
  if (!citizen) {
    citizen = await User.create({
      name: 'Aditya Pawar',
      email: 'citizen@example.com',
      passwordHash: defaultCitizenPassword,
      displayName: 'Aditya Pawar',
      phoneHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      phoneMasked: 'XXXXXX4589',
      role: 'citizen',
      language: 'mr',
      homeArea: { ward: 'Ward 12 (Nigdi)', city: 'Pimpri-Chinchwad', district: 'Pune' },
    });
    console.log('[Seed] Created Citizen: citizen@example.com (Password: Citizen@123)');
  }

  // 3. Seed Sample Issues
  const existingCount = await Issue.countDocuments();
  if (existingCount === 0 && officeMap['roads'] && officeMap['water']) {
    await Issue.create([
      {
        authorId: citizen._id,
        isAnonymous: false,
        title: 'आकुर्डी रेल्वे स्टेशन समोरील रस्त्यावर धोकादायक खड्डे व तुंबलेले पाणी',
        description:
          'गेल्या २ आठवड्यांपासून स्टेशन परिसरातील मुख्य रस्त्यावर पावसाचे पाणी तुंबून मोठे खड्डे पडले आहेत. दुचाकी घसरून अनेक नागरिक जखमी झाले आहेत. तातडीने डांबरीकरण आवश्यक आहे.',
        category: 'roads',
        officeId: officeMap['roads']._id,
        location: {
          type: 'Point',
          coordinates: [73.7842, 18.6508],
          address: 'Akurdi Railway Station Road',
          ward: 'Ward 10 (Akurdi)',
          city: 'Pimpri-Chinchwad',
        },
        status: 'submitted',
        raiseCount: 84,
        createdAt: new Date(Date.now() - 3600000 * 72), // 3 days ago (triggers escalation clock!)
      },
      {
        authorId: citizen._id,
        isAnonymous: false,
        title: 'निगडी सेक्टर २४ मध्ये गेल्या ३ दिवसांपासून पिण्याच्या पाण्याचा अनियमित पुरवठा',
        description:
          'सकाळी फक्त १५ मिनिटे कमी दाबाने गढूळ पाणी येत आहे. परिसरातील ज्येष्ठ नागरिक व कुटुंबांना टँकरवर अवलंबून राहावे लागत आहे.',
        category: 'water',
        officeId: officeMap['water']._id,
        location: {
          type: 'Point',
          coordinates: [73.7812, 18.6548],
          address: 'Sector 24, Pradhikaran, Nigdi',
          ward: 'Ward 12 (Nigdi)',
          city: 'Pimpri-Chinchwad',
        },
        status: 'acknowledged',
        raiseCount: 142,
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
    ]);
    console.log('[Seed] Seeded initial real issues with escalation triggers.');
  }

  console.log('\n[Seed] Complete! Demo accounts ready:');
  console.log('  🛡️ Admin:    admin@raise.org             / Admin@123');
  console.log('  🏛️ Official: officer.water@pcmc.gov.in   / Officer@123');
  console.log('  🏛️ Official: officer.roads@pcmc.gov.in   / Officer@123');
  console.log('  👤 Citizen:  citizen@example.com         / Citizen@123\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
