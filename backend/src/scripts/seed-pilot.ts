import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Office } from '../models/Office.js';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { config } from '../config/env.js';
import { OtpService } from '../services/otp.service.js';
import { EmailUtil } from '../utils/email.util.js';

export const PILOT_WARD_12_BOUNDARY: {
  type: 'Polygon';
  coordinates: [number, number][][];
} = {
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
};

export const PCMC_HQ_BOUNDARY: {
  type: 'Polygon';
  coordinates: [number, number][][];
} = {
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
};

export async function seedPilotWard() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PILOT_SEED !== 'true') {
    throw new Error('FATAL: seed-pilot can only run in production when ALLOW_PILOT_SEED="true" is explicitly configured.');
  }

  console.log('[PilotSeed] Connecting to MongoDB:', config.mongoUri);
  await mongoose.connect(config.mongoUri);

  // 1. Seed Jurisdictions: HQ & Ward 12
  let hqJur = await Jurisdiction.findOne({ code: 'PCMC-HQ' });
  if (!hqJur) {
    hqJur = await Jurisdiction.create({
      name: 'PCMC Central Headquarters',
      nameMr: 'पिं.चिं.म.न.पा. मुख्य प्रशासकीय मुख्यालय',
      nameHi: 'पिं.चिं.म.न.पा. मुख्य प्रशासनिक मुख्यालय',
      code: 'PCMC-HQ',
      type: 'hq',
      slaHoursDefault: 96,
      boundary: PCMC_HQ_BOUNDARY,
      active: true,
    });
    console.log('[PilotSeed] Created HQ Jurisdiction:', hqJur.code);
  } else {
    console.log('[PilotSeed] Found existing HQ Jurisdiction:', hqJur.code);
  }

  let ward12Jur = await Jurisdiction.findOne({ code: 'WARD-12' });
  if (!ward12Jur) {
    ward12Jur = await Jurisdiction.create({
      name: 'PCMC Ward 12 (Nigdi - Pradhikaran)',
      nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ (निगडी - प्राधिकरण)',
      nameHi: 'पिं.चिं.म.न.पा. वार्ड १२ (निगडी - प्राधिकरण)',
      code: 'WARD-12',
      type: 'ward',
      slaHoursDefault: 48,
      boundary: PILOT_WARD_12_BOUNDARY,
      parentJurisdictionId: hqJur._id,
      active: true,
    });
    console.log('[PilotSeed] Created Ward 12 Jurisdiction:', ward12Jur.code);
  } else {
    await Jurisdiction.updateOne(
      { _id: ward12Jur._id },
      { $set: { boundary: PILOT_WARD_12_BOUNDARY, parentJurisdictionId: hqJur._id } }
    );
    console.log('[PilotSeed] Updated Ward 12 Jurisdiction boundary:', ward12Jur.code);
  }

  // 2. Seed 3 Real Offices
  // Office 3: PCMC Central Grievance Redressal Cell (Corporation Level HQ Escalation Tier)
  let grievanceHqOffice = await Office.findOne({ name: 'PCMC Central Grievance Redressal Cell' });
  if (!grievanceHqOffice) {
    grievanceHqOffice = await Office.create({
      name: 'PCMC Central Grievance Redressal Cell',
      nameMr: 'पिं.चिं.म.न.पा. मुख्य तक्रार निवारण कक्ष (मुख्यालय)',
      nameHi: 'पिं.चिं.म.न.पा. केंद्रीय शिकायत निवारण प्रकोष्ठ (मुख्यालय)',
      level: 'corporation',
      department: 'general',
      jurisdiction: {
        city: 'Pimpri-Chinchwad',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.8016, 18.6277] },
      },
      jurisdictionId: hqJur._id,
      supportedCategories: ['roads', 'water', 'sanitation', 'health', 'electricity', 'general'],
      slaHours: 72,
      officialEmail: 'grievance.hq@pcmc.gov.in',
      claimStatus: 'claimed',
      stats: { issuesTotal: 0, issuesAcknowledged: 0, issuesResolved: 0, avgResponseHours: 12 },
    });
    console.log('[PilotSeed] Created Office:', grievanceHqOffice.name);
  }

  // Office 1: PCMC Ward 12 Field Office (Junior Engineer / Sanitation Inspector)
  let ward12Office = await Office.findOne({ name: 'PCMC Ward 12 Field Office (Nigdi - Pradhikaran)' });
  if (!ward12Office) {
    ward12Office = await Office.create({
      name: 'PCMC Ward 12 Field Office (Nigdi - Pradhikaran)',
      nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ क्षेत्रीय कार्यालय (निगडी - प्राधिकरण)',
      nameHi: 'पिं.चिं.म.न.पा. वार्ड १२ क्षेत्रीय कार्यालय (निगडी - प्राधिकरण)',
      level: 'ward',
      department: 'general',
      jurisdiction: {
        ward: 'Ward 12',
        city: 'Pimpri-Chinchwad',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.7842, 18.6508] },
      },
      jurisdictionId: ward12Jur._id,
      parentOfficeId: grievanceHqOffice._id,
      escalatesToOfficeId: grievanceHqOffice._id,
      supportedCategories: ['roads', 'sanitation', 'general'],
      slaHours: 48,
      officialEmail: 'inspector.ward12@pcmc.gov.in',
      claimStatus: 'claimed',
      stats: { issuesTotal: 2, issuesAcknowledged: 1, issuesResolved: 0, avgResponseHours: 8 },
    });
    console.log('[PilotSeed] Created Office:', ward12Office.name);
  } else {
    await Office.updateOne(
      { _id: ward12Office._id },
      { $set: { escalatesToOfficeId: grievanceHqOffice._id, jurisdictionId: ward12Jur._id } }
    );
  }

  // Office 2: PCMC Water Supply Division (Executive Engineer)
  let waterDivOffice = await Office.findOne({ name: 'PCMC Water Supply Division (Zone A & Ward 12)' });
  if (!waterDivOffice) {
    waterDivOffice = await Office.create({
      name: 'PCMC Water Supply Division (Zone A & Ward 12)',
      nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा विभाग (प्रभाग १२ व ‘अ’ प्रभाग)',
      nameHi: 'पिं.चिं.म.न.पा. जल आपूर्ति प्रभाग (वार्ड १२)',
      level: 'corporation',
      department: 'water',
      jurisdiction: {
        ward: 'Ward 12',
        city: 'Pimpri-Chinchwad',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.8016, 18.6277] },
      },
      jurisdictionId: hqJur._id,
      parentOfficeId: grievanceHqOffice._id,
      escalatesToOfficeId: grievanceHqOffice._id,
      supportedCategories: ['water'],
      slaHours: 48,
      officialEmail: 'ee.water@pcmc.gov.in',
      claimStatus: 'claimed',
      stats: { issuesTotal: 1, issuesAcknowledged: 1, issuesResolved: 0, avgResponseHours: 6 },
    });
    console.log('[PilotSeed] Created Office:', waterDivOffice.name);
  } else {
    await Office.updateOne(
      { _id: waterDivOffice._id },
      { $set: { escalatesToOfficeId: grievanceHqOffice._id } }
    );
  }

  // 3. Seed Pilot Officials & Citizens
  const defaultOfficerPassword = await bcrypt.hash('Officer@123', 12);
  const defaultCitizenPassword = await bcrypt.hash('Citizen@123', 12);

  // Official 1: Ward 12 Field Office Inspector
  let inspector = await User.findOne({ email: 'inspector.ward12@pcmc.gov.in' });
  if (!inspector) {
    const rawPhone = '+919876500012';
    inspector = await User.create({
      name: 'Kailas Gaikwad (Junior Engineer)',
      displayName: 'Kailas Gaikwad (JE Ward 12)',
      email: 'inspector.ward12@pcmc.gov.in',
      emailHash: EmailUtil.hash('inspector.ward12@pcmc.gov.in', config.emailHashSecret),
      passwordHash: defaultOfficerPassword,
      phoneEnc: OtpService.encryptPhone(rawPhone),
      phoneHash: OtpService.hashPhone(rawPhone),
      phoneMasked: OtpService.maskPhone(rawPhone),
      role: 'official',
      status: 'active',
      isOfficialVerified: true,
      officialOfficeId: ward12Office._id,
      designation: 'Junior Engineer / Sanitation Inspector',
      employeeId: 'PCMC-W12-088',
      language: 'mr',
      officeMemberships: [{ officeId: ward12Office._id, memberRole: 'officer', status: 'active' }],
      verifiedMethods: ['email', 'phone'],
    });
    await Office.findByIdAndUpdate(ward12Office._id, { claimedBy: inspector._id });
    console.log('[PilotSeed] Seeded Official:', inspector.email);
  }

  // Official 2: Water Supply Division Executive Engineer
  let eeWater = await User.findOne({ email: 'ee.water@pcmc.gov.in' });
  if (!eeWater) {
    const rawPhone = '+919876500013';
    eeWater = await User.create({
      name: 'Ramesh Patil (Executive Engineer)',
      displayName: 'Ramesh Patil (EE Water)',
      email: 'ee.water@pcmc.gov.in',
      emailHash: EmailUtil.hash('ee.water@pcmc.gov.in', config.emailHashSecret),
      passwordHash: defaultOfficerPassword,
      phoneEnc: OtpService.encryptPhone(rawPhone),
      phoneHash: OtpService.hashPhone(rawPhone),
      phoneMasked: OtpService.maskPhone(rawPhone),
      role: 'official',
      status: 'active',
      isOfficialVerified: true,
      officialOfficeId: waterDivOffice._id,
      designation: 'Executive Engineer (Water Supply)',
      employeeId: 'PCMC-WTR-014',
      language: 'mr',
      officeMemberships: [{ officeId: waterDivOffice._id, memberRole: 'head', status: 'active' }],
      verifiedMethods: ['email', 'phone'],
    });
    await Office.findByIdAndUpdate(waterDivOffice._id, { claimedBy: eeWater._id });
    console.log('[PilotSeed] Seeded Official:', eeWater.email);
  }

  // Official 3: HQ Designated Grievance Officer
  let hqGrievanceOfficer = await User.findOne({ email: 'grievance.hq@pcmc.gov.in' });
  if (!hqGrievanceOfficer) {
    const rawPhone = '+919876500014';
    hqGrievanceOfficer = await User.create({
      name: 'Adv. Radhika Deshmukh (Public Grievance Officer)',
      displayName: 'Adv. Radhika Deshmukh (HQ)',
      email: 'grievance.hq@pcmc.gov.in',
      emailHash: EmailUtil.hash('grievance.hq@pcmc.gov.in', config.emailHashSecret),
      passwordHash: defaultOfficerPassword,
      phoneEnc: OtpService.encryptPhone(rawPhone),
      phoneHash: OtpService.hashPhone(rawPhone),
      phoneMasked: OtpService.maskPhone(rawPhone),
      role: 'official',
      status: 'active',
      isOfficialVerified: true,
      officialOfficeId: grievanceHqOffice._id,
      designation: 'Designated Public Grievance Officer',
      employeeId: 'PCMC-HQ-001',
      language: 'mr',
      officeMemberships: [{ officeId: grievanceHqOffice._id, memberRole: 'head', status: 'active' }],
      verifiedMethods: ['email', 'phone'],
    });
    await Office.findByIdAndUpdate(grievanceHqOffice._id, { claimedBy: hqGrievanceOfficer._id });
    console.log('[PilotSeed] Seeded Official:', hqGrievanceOfficer.email);
  }

  // Citizens: Aditya Pawar & Sunita Kamble
  let citizenAditya = await User.findOne({ email: 'aditya.pawar@example.com' });
  if (!citizenAditya) {
    const rawPhone = '+919876543210';
    citizenAditya = await User.create({
      name: 'Aditya Pawar',
      displayName: 'Aditya P (Pradhikaran)',
      email: 'aditya.pawar@example.com',
      emailHash: EmailUtil.hash('aditya.pawar@example.com', config.emailHashSecret),
      passwordHash: defaultCitizenPassword,
      phoneEnc: OtpService.encryptPhone(rawPhone),
      phoneHash: OtpService.hashPhone(rawPhone),
      phoneMasked: OtpService.maskPhone(rawPhone),
      role: 'citizen',
      status: 'active',
      language: 'mr',
      homeWard: 'Ward 12',
      homeArea: { ward: 'Ward 12', city: 'Pimpri-Chinchwad', district: 'Pune' },
      isProfileComplete: true,
      consentVersion: '2026.1',
      consentAt: new Date(),
      verifiedMethods: ['email', 'phone'],
    });
    await NotificationPreference.create({ userId: citizenAditya._id, channels: { sms: true, in_app: true, email: true } });
    console.log('[PilotSeed] Seeded Citizen:', citizenAditya.email);
  }

  let citizenSunita = await User.findOne({ email: 'sunita.kamble@example.com' });
  if (!citizenSunita) {
    const rawPhone = '+919876543211';
    citizenSunita = await User.create({
      name: 'Sunita Kamble',
      displayName: 'Sunita K (Akurdi)',
      email: 'sunita.kamble@example.com',
      emailHash: EmailUtil.hash('sunita.kamble@example.com', config.emailHashSecret),
      passwordHash: defaultCitizenPassword,
      phoneEnc: OtpService.encryptPhone(rawPhone),
      phoneHash: OtpService.hashPhone(rawPhone),
      phoneMasked: OtpService.maskPhone(rawPhone),
      role: 'citizen',
      status: 'active',
      language: 'mr',
      homeWard: 'Ward 12',
      homeArea: { ward: 'Ward 12', city: 'Pimpri-Chinchwad', district: 'Pune' },
      isProfileComplete: true,
      consentVersion: '2026.1',
      consentAt: new Date(),
      verifiedMethods: ['email', 'phone'],
    });
    await NotificationPreference.create({ userId: citizenSunita._id, channels: { sms: true, in_app: true, email: true } });
    console.log('[PilotSeed] Seeded Citizen:', citizenSunita.email);
  }

  // 4. Seed 3 Realistic Ward 12 Grievances
  const pcmcIssue1Title = 'आकुर्डी रेल्वे स्टेशन समोरील रस्त्यावर धोकादायक खड्डे व तुंबलेले पाणी';
  let issue1 = await Issue.findOne({ title: pcmcIssue1Title });
  if (!issue1) {
    issue1 = await Issue.create({
      authorId: citizenSunita._id,
      isAnonymous: false,
      title: pcmcIssue1Title,
      description:
        'गेल्या २ आठवड्यांपासून स्टेशन परिसरातील मुख्य रस्त्यावर पावसाचे पाणी तुंबून मोठे खड्डे पडले आहेत. दुचाकी घसरून अनेक नागरिक जखमी झाले आहेत. तातडीने डांबरीकरण आवश्यक आहे.',
      category: 'roads',
      officeId: ward12Office._id,
      jurisdictionId: ward12Jur._id,
      location: {
        type: 'Point',
        coordinates: [73.7842, 18.6508],
        address: 'Akurdi Railway Station Approach Road, Ward 12',
        ward: 'Ward 12',
        city: 'Pimpri-Chinchwad',
      },
      status: 'acknowledged',
      raiseCount: 84,
      slaHours: 48,
      slaDeadline: new Date(Date.now() + 3600000 * 24),
      statusTimeline: [
        { status: 'submitted', note: 'Grievance submitted by citizen', updatedAt: new Date(Date.now() - 3600000 * 24) },
        {
          status: 'acknowledged',
          note: 'पाहणी केली असून दुरुस्तीसाठी संबंधित कंत्राटदाराला सूचना दिली आहे.',
          updatedBy: inspector._id,
          updatedAt: new Date(Date.now() - 3600000 * 12),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 24),
    });
    console.log('[PilotSeed] Seeded Grievance 1: Akurdi Station Potholes');
  }

  const pcmcIssue2Title = 'निगडी सेक्टर २४ मध्ये गेल्या ३ दिवसांपासून पिण्याच्या पाण्याचा अनियमित पुरवठा';
  let issue2 = await Issue.findOne({ title: pcmcIssue2Title });
  if (!issue2) {
    issue2 = await Issue.create({
      authorId: citizenAditya._id,
      isAnonymous: false,
      title: pcmcIssue2Title,
      description:
        'सकाळी फक्त १५ मिनिटे कमी दाबाने गढूळ पाणी येत आहे. परिसरातील ज्येष्ठ नागरिक व कुटुंबांना टँकरवर अवलंबून राहावे लागत आहे.',
      category: 'water',
      officeId: waterDivOffice._id,
      jurisdictionId: ward12Jur._id,
      location: {
        type: 'Point',
        coordinates: [73.7812, 18.6548],
        address: 'Sector 24, Pradhikaran, Nigdi, Ward 12',
        ward: 'Ward 12',
        city: 'Pimpri-Chinchwad',
      },
      status: 'in_progress',
      raiseCount: 142,
      slaHours: 48,
      slaDeadline: new Date(Date.now() + 3600000 * 18),
      statusTimeline: [
        { status: 'submitted', note: 'Grievance submitted by resident', updatedAt: new Date(Date.now() - 3600000 * 30) },
        {
          status: 'acknowledged',
          note: 'जलवाहिनी तपासणी सुरू आहे.',
          updatedBy: eeWater._id,
          updatedAt: new Date(Date.now() - 3600000 * 18),
        },
        {
          status: 'in_progress',
          note: 'मुख्य वॉल्व दुरुस्तीचे काम युद्धपातळीवर चालू आहे. संध्याकाळपर्यंत सुरळीत पाणीपुरवठा होईल.',
          updatedBy: eeWater._id,
          updatedAt: new Date(Date.now() - 3600000 * 6),
        },
      ],
      createdAt: new Date(Date.now() - 3600000 * 30),
    });
    console.log('[PilotSeed] Seeded Grievance 2: Sector 24 Drinking Water Supply');
  }

  const pcmcIssue3Title = 'प्राधिकरण भाजी मंडई जवळ कचऱ्याचे ढीग व दुर्गंधी';
  let issue3 = await Issue.findOne({ title: pcmcIssue3Title });
  if (!issue3) {
    issue3 = await Issue.create({
      authorId: citizenAditya._id,
      isAnonymous: false,
      title: pcmcIssue3Title,
      description:
        'मंडई लगतच्या चौकात कचरा कुंडी ओव्हरफ्लो झाली असून दुर्गंधी पसरली आहे. सांडपाणी रस्त्यावर आल्याने रोगराईची भीती निर्माण झाली आहे.',
      category: 'sanitation',
      officeId: ward12Office._id,
      jurisdictionId: ward12Jur._id,
      location: {
        type: 'Point',
        coordinates: [73.7785, 18.6590],
        address: 'Sector 25, Pradhikaran Vegetable Market, Nigdi, Ward 12',
        ward: 'Ward 12',
        city: 'Pimpri-Chinchwad',
      },
      status: 'submitted',
      raiseCount: 65,
      slaHours: 48,
      slaDeadline: new Date(Date.now() + 3600000 * 42),
      statusTimeline: [
        { status: 'submitted', note: 'Reported by local shoppers', updatedAt: new Date(Date.now() - 3600000 * 6) },
      ],
      createdAt: new Date(Date.now() - 3600000 * 6),
    });
    console.log('[PilotSeed] Seeded Grievance 3: Vegetable Market Garbage');
  }

  console.log('\n================================================================');
  console.log('✅ Ward 12 (Nigdi - Pradhikaran) Pilot Seed Complete!');
  console.log('================================================================');
  console.log('🏛️ Offices Seeded:');
  console.log('  1. PCMC Ward 12 Field Office (inspector.ward12@pcmc.gov.in / Officer@123)');
  console.log('  2. PCMC Water Supply Division (ee.water@pcmc.gov.in / Officer@123)');
  console.log('  3. PCMC Central Grievance Redressal Cell (grievance.hq@pcmc.gov.in / Officer@123)');
  console.log('\n👥 Citizen Accounts:');
  console.log('  1. Aditya Pawar (aditya.pawar@example.com / Citizen@123)');
  console.log('  2. Sunita Kamble (sunita.kamble@example.com / Citizen@123)');
  console.log('\n📋 Active Pilot Grievances:');
  console.log('  1. Roads: Akurdi Railway Station Potholes (84 raises, acknowledged)');
  console.log('  2. Water: Sector 24 Water Supply (142 raises, in_progress)');
  console.log('  3. Sanitation: Pradhikaran Market Garbage (65 raises, submitted)');
  console.log('================================================================\n');

  await mongoose.disconnect();
}

// Allow direct CLI invocation
if (process.argv[1]?.endsWith('seed-pilot.ts')) {
  seedPilotWard().catch((err) => {
    console.error('[PilotSeed] Fatal error:', err);
    process.exit(1);
  });
}
