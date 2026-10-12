import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { Jurisdiction } from '../models/Jurisdiction.js';
import { Office } from '../models/Office.js';
import { User } from '../models/User.js';
import { Issue } from '../models/Issue.js';
import { Raise } from '../models/Raise.js';
import { TownhallTopic } from '../models/TownhallTopic.js';
import { TownhallFeedback } from '../models/TownhallFeedback.js';
import { RepresentativeProfile } from '../models/RepresentativeProfile.js';
import { RepresentativeAsk } from '../models/RepresentativeAsk.js';
import { RepresentativeUpdate } from '../models/RepresentativeUpdate.js';
import { ModerationReport } from '../models/ModerationReport.js';
import { FreezeWindow } from '../models/FreezeWindow.js';
import { Donation } from '../models/Donation.js';

function computeEmailHash(email: string): string {
  const secret = config.emailHashSecret || config.phoneHashSecret || 'raise_dev_email_hash_secret_2026';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

async function runPreDeploymentSimulation() {
  console.log('========================================================');
  console.log('🚀 STARTING RAISE PRE-DEPLOYMENT MULTI-ROLE SIMULATION');
  console.log('========================================================\n');

  console.log('[1/10] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);
  console.log('  ✓ Connected to:', config.mongoUri);

  const unifiedPassword = 'Raise2026!';
  const passwordHash = await bcrypt.hash(unifiedPassword, 12);

  // ==========================================
  // STEP 1: Seed Jurisdictions
  // ==========================================
  console.log('\n[2/10] Seeding Jurisdictions (Municipal & Gram Panchayat)...');
  
  // HQ
  let hqJur = await Jurisdiction.findOne({ code: 'PCMC-HQ' });
  if (!hqJur) {
    hqJur = await Jurisdiction.create({
      name: 'PCMC Central Headquarters',
      nameMr: 'पिं.चिं.म.न.पा. मुख्य प्रशासकीय मुख्यालय',
      nameHi: 'पिं.चिं.म.न.पा. मुख्य प्रशासनिक मुख्यालय',
      code: 'PCMC-HQ',
      type: 'hq',
      slaHoursDefault: 96,
      boundary: {
        type: 'Polygon',
        coordinates: [[[73.700, 18.580], [73.900, 18.580], [73.900, 18.720], [73.700, 18.720], [73.700, 18.580]]],
      },
    });
    console.log('  ✓ Created PCMC-HQ');
  }

  // Zone A
  let zoneAJur = await Jurisdiction.findOne({ code: 'ZONE-A' });
  if (!zoneAJur) {
    zoneAJur = await Jurisdiction.create({
      name: 'PCMC Zone A (Pradhikaran - Akurdi)',
      nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय कार्यक्षेत्र',
      nameHi: "पिं.चिं.म.न.पा. 'अ' जोनल कार्यालय कार्यक्षेत्र",
      code: 'ZONE-A',
      type: 'zone',
      parentJurisdictionId: hqJur._id,
      slaHoursDefault: 72,
      boundary: {
        type: 'Polygon',
        coordinates: [[[73.750, 18.630], [73.810, 18.630], [73.810, 18.690], [73.750, 18.690], [73.750, 18.630]]],
      },
    });
    console.log('  ✓ Created ZONE-A');
  }

  // Ward 12
  let ward12Jur = await Jurisdiction.findOne({ code: 'WARD-12' });
  if (!ward12Jur) {
    ward12Jur = await Jurisdiction.create({
      name: 'PCMC Ward 12 (Nigdi - Pradhikaran)',
      nameMr: 'पिं.चिं.म.न.पा. प्रभाग १२ (निगडी - प्राधिकरण)',
      nameHi: 'पिं.चिं.म.न.पा. वार्ड १२ (निगडी - प्राधिकरण)',
      code: 'WARD-12',
      type: 'ward',
      parentJurisdictionId: zoneAJur._id,
      slaHoursDefault: 48,
      boundary: {
        type: 'Polygon',
        coordinates: [[[73.765, 18.650], [73.795, 18.650], [73.795, 18.675], [73.765, 18.675], [73.765, 18.650]]],
      },
    });
    console.log('  ✓ Created WARD-12');
  }

  // Rural Gram Panchayat: Hinjawadi
  let hinjawadiJur = await Jurisdiction.findOne({ code: 'GP-HINJAWADI' });
  if (!hinjawadiJur) {
    hinjawadiJur = await Jurisdiction.create({
      name: 'Hinjawadi Gram Panchayat',
      nameMr: 'हिंजवडी ग्रामपंचायत कार्यक्षेत्र',
      nameHi: 'हिंजवड़ी ग्राम पंचायत कार्यक्षेत्र',
      code: 'GP-HINJAWADI',
      type: 'ward', // using ward/constituency level
      slaHoursDefault: 72,
      boundary: {
        type: 'Polygon',
        coordinates: [[[73.720, 18.580], [73.760, 18.580], [73.760, 18.620], [73.720, 18.620], [73.720, 18.580]]],
      },
    });
    console.log('  ✓ Created GP-HINJAWADI');
  }

  // ==========================================
  // STEP 2: Seed Offices
  // ==========================================
  console.log('\n[3/10] Seeding Public Offices...');

  // PCMC Water Supply Dept
  let waterOffice = await Office.findOne({ name: 'PCMC Water Supply & Drainage Department' });
  if (!waterOffice) {
    waterOffice = await Office.create({
      name: 'PCMC Water Supply & Drainage Department',
      nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
      nameHi: 'पिं.चिं.म.न.पा. जल आपूर्ति एवं जल निकासी विभाग',
      level: 'corporation',
      kind: 'department',
      department: 'water',
      jurisdictionId: hqJur._id,
      jurisdiction: {
        city: 'Pimpri-Chinchwad',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.8016, 18.6277] },
      },
      claimStatus: 'claimed',
      officialEmail: 'officer.water.qa@raise.local',
      supportedCategories: ['water', 'general'],
      slaHours: 48,
      stats: { issuesTotal: 12, issuesAcknowledged: 10, issuesResolved: 8, avgResponseHours: 18 },
    });
    console.log('  ✓ Created Water Office');
  } else {
    waterOffice.claimStatus = 'claimed';
    waterOffice.officialEmail = 'officer.water.qa@raise.local';
    await waterOffice.save();
  }

  // Hinjawadi Gram Panchayat Office
  let gpOffice = await Office.findOne({ name: 'Hinjawadi Gram Panchayat Office' });
  if (!gpOffice) {
    gpOffice = await Office.create({
      name: 'Hinjawadi Gram Panchayat Office',
      nameMr: 'हिंजवडी ग्रामपंचायत कार्यालय',
      nameHi: 'हिंजवड़ी ग्राम पंचायत कार्यालय',
      level: 'gram_panchayat',
      kind: 'ward_office',
      department: 'general',
      jurisdictionId: hinjawadiJur._id,
      jurisdiction: {
        city: 'Pune Rural',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.7389, 18.5913] },
      },
      claimStatus: 'claimed',
      officialEmail: 'sarpanch.hinjawadi@raise.local',
      supportedCategories: ['general', 'water', 'roads', 'sanitation'],
      slaHours: 72,
      stats: { issuesTotal: 5, issuesAcknowledged: 4, issuesResolved: 3, avgResponseHours: 24 },
    });
    console.log('  ✓ Created Gram Panchayat Office');
  }

  // Representative Office: Ward 12 Councillor Rahul Shinde
  let repOffice = await Office.findOne({ name: 'Office of Ward Councillor Rahul Shinde' });
  if (!repOffice) {
    repOffice = await Office.create({
      name: 'Office of Ward Councillor Rahul Shinde',
      nameMr: 'प्रभाग १२ नगरसेवक राहुल शिंदे कार्यालय',
      nameHi: 'वार्ड १२ पार्षद राहुल शिंदे कार्यालय',
      level: 'ward',
      kind: 'representative_office',
      department: 'general',
      jurisdictionId: ward12Jur._id,
      jurisdiction: {
        ward: 'PCMC Ward 12 (Nigdi - Pradhikaran)',
        city: 'Pimpri-Chinchwad',
        district: 'Pune',
        state: 'Maharashtra',
        location: { type: 'Point', coordinates: [73.7812, 18.6548] },
      },
      claimStatus: 'claimed',
      supportedCategories: ['general', 'water', 'roads', 'sanitation', 'electricity'],
      slaHours: 48,
    });
    console.log('  ✓ Created Representative Office');
  }

  // Representative Profile: Rahul Shinde
  let repProfile = await RepresentativeProfile.findOne({ officeId: repOffice._id });
  if (!repProfile) {
    repProfile = await RepresentativeProfile.create({
      officeId: repOffice._id,
      role: 'ward_councillor',
      titleText: 'Ward 12 Councillor Rahul Shinde',
      jurisdictionId: ward12Jur._id,
      termStart: new Date('2024-01-01'),
      termEnd: new Date('2029-01-01'),
      status: 'verified',
      displayName: 'Rahul Shinde',
      officialSiteUrl: 'https://pcmcindia.gov.in/councillors/ward-12',
      verification: {
        method: 'electoral_gazette',
        reviewedAt: new Date(),
        notes: 'Verified via PCMC Gazette Notification 2024/W12',
      },
    });
    console.log('  ✓ Created Representative Profile for Rahul Shinde');
  } else {
    repProfile.status = 'verified';
    await repProfile.save();
  }

  // ==========================================
  // STEP 3: Seed the Dedicated 6-User Test Cohort
  // ==========================================
  console.log('\n[4/10] Seeding Dedicated 6-Persona Test Cohort (All Passwords: Raise2026!)...');

  const cohortUsers = [
    {
      name: 'Kavita Joshi',
      email: 'citizen.qa@raise.local',
      displayName: 'Kavita Joshi',
      role: 'citizen',
      language: 'mr',
      isProfileComplete: true,
      homeWard: 'Ward 12 (Nigdi)',
      homeArea: { ward: 'Ward 12 (Nigdi)', city: 'Pimpri-Chinchwad', district: 'Pune' },
    },
    {
      name: 'Amitabh Deshmukh',
      email: 'citizen2.qa@raise.local',
      displayName: 'Amitabh Deshmukh',
      role: 'citizen',
      language: 'en',
      isProfileComplete: true,
      homeWard: 'Ward 12 (Nigdi)',
      homeArea: { ward: 'Ward 12 (Nigdi)', city: 'Pimpri-Chinchwad', district: 'Pune' },
    },
    {
      name: 'Sunita Patil',
      email: 'citizen.rural.qa@raise.local',
      displayName: 'Sunita Patil',
      role: 'citizen',
      language: 'hi',
      isProfileComplete: true,
      homeWard: 'Hinjawadi Gram Panchayat',
      homeArea: { ward: 'Hinjawadi', city: 'Pune Rural', district: 'Pune' },
    },
    {
      name: 'Rajesh Kulkarni',
      email: 'officer.water.qa@raise.local',
      displayName: 'Rajesh Kulkarni (EE Water)',
      role: 'official',
      language: 'mr',
      isOfficialVerified: true,
      officialOfficeId: waterOffice._id,
      designation: 'Executive Engineer',
      employeeId: 'PCMC-WTR-8842',
      officeMemberships: [{ officeId: waterOffice._id, memberRole: 'head', status: 'active' }],
      isProfileComplete: true,
    },
    {
      name: 'Rahul Shinde',
      email: 'rep.councillor.qa@raise.local',
      displayName: 'Rahul Shinde (Ward Councillor)',
      role: 'official',
      language: 'mr',
      isOfficialVerified: true,
      officialOfficeId: repOffice._id,
      designation: 'Ward Councillor',
      employeeId: 'PCMC-REP-W12',
      officeMemberships: [{ officeId: repOffice._id, memberRole: 'head', status: 'active' }],
      isProfileComplete: true,
    },
    {
      name: 'Siddharth Rao',
      email: 'admin.qa@raise.local',
      displayName: 'Siddharth Rao (Civic Auditor)',
      role: 'admin',
      language: 'en',
      isOfficialVerified: true,
      isProfileComplete: true,
    },
  ];

  const userMap: Record<string, any> = {};

  for (const uData of cohortUsers) {
    const emailHash = computeEmailHash(uData.email);
    let user = await User.findOne({ $or: [{ email: uData.email }, { emailHash }] });

    if (!user) {
      user = await User.create({
        ...uData,
        emailHash,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        status: 'active',
        tokenVersion: 1,
      });
      console.log(`  ✓ Created [${uData.role}] ${uData.displayName} <${uData.email}>`);
    } else {
      user.name = uData.name;
      user.displayName = uData.displayName;
      user.role = uData.role as any;
      user.language = uData.language as any;
      user.passwordHash = passwordHash;
      user.email = uData.email;
      user.emailHash = emailHash;
      user.emailVerified = true;
      user.isActive = true;
      user.status = 'active';
      user.isOfficialVerified = Boolean(uData.isOfficialVerified);
      if (uData.officialOfficeId) user.officialOfficeId = uData.officialOfficeId;
      if (uData.officeMemberships) user.officeMemberships = uData.officeMemberships as any;
      if (uData.designation) user.designation = uData.designation;
      if (uData.homeArea) user.homeArea = uData.homeArea;
      await user.save();
      console.log(`  ✓ Updated [${uData.role}] ${uData.displayName} <${uData.email}>`);
    }
    userMap[uData.email] = user;
  }

  // Bind office claim to water officer
  waterOffice.claimedBy = userMap['officer.water.qa@raise.local']._id;
  await waterOffice.save();

  // Bind rep office to representative
  repOffice.claimedBy = userMap['rep.councillor.qa@raise.local']._id;
  await repOffice.save();

  // ==========================================
  // STEP 4: Simulate Domain 1: Citizen Grievance Lifecycle
  // ==========================================
  console.log('\n[5/10] Simulating Domain 1: Citizen Grievance Lifecycle...');

  let testIssue = await Issue.findOne({
    title: 'पिं.चिं.म.न.पा. प्रभाग १२ - सेक्टर २४ मध्ये कमी दाबाने गढूळ पाणी पुरवठा',
  });

  if (!testIssue) {
    testIssue = await Issue.create({
      authorId: userMap['citizen.qa@raise.local']._id,
      isAnonymous: false,
      title: 'पिं.चिं.म.न.पा. प्रभाग १२ - सेक्टर २४ मध्ये कमी दाबाने गढूळ पाणी पुरवठा',
      description:
        'सेक्टर २४, निगडी प्राधिकरण येथे गेल्या आठवड्यापासून पिण्याच्या पाण्याचा दाब अत्यंत कमी आहे आणि गढूळ पाणी येत आहे. ३०० हून अधिक कुटुंबे प्रभावित आहेत.',
      category: 'water',
      officeId: waterOffice._id,
      jurisdictionId: ward12Jur._id,
      location: {
        type: 'Point',
        coordinates: [73.7812, 18.6548],
        address: 'Sector 24, Pradhikaran, Nigdi',
        ward: 'Ward 12 (Nigdi)',
        city: 'Pimpri-Chinchwad',
      },
      status: 'submitted',
      raiseCount: 1,
      slaHours: 48,
      slaDeadline: new Date(Date.now() + 48 * 3600000),
      escalationLevel: 0,
      escalationHistory: [],
      media: [
        {
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593',
          filename: 'turbid_water_sample.jpg',
          mimeType: 'image/jpeg',
        },
      ],
      statusTimeline: [
        {
          status: 'submitted',
          note: 'नागरिक तक्रार दाखल केली.',
          updatedBy: userMap['citizen.qa@raise.local']._id,
          updatedAt: new Date(Date.now() - 36 * 3600000),
        },
      ],
      moderationState: 'clean',
    });
    console.log('  ✓ Filed Grievance by Kavita Joshi (Citizen 1)');
  }

  // Backing by Amitabh Deshmukh (One-Person-One-Raise)
  const existingRaise = await Raise.findOne({
    issueId: testIssue._id,
    userId: userMap['citizen2.qa@raise.local']._id,
  });
  if (!existingRaise) {
    await Raise.create({
      issueId: testIssue._id,
      userId: userMap['citizen2.qa@raise.local']._id,
    });
    testIssue.raiseCount = (testIssue.raiseCount || 1) + 1;
    console.log('  ✓ Amitabh Deshmukh (Citizen 2) backed the grievance (Raise count: 2)');
  }

  // Officer transitions: in_progress -> resolved_pending_confirmation
  testIssue.status = 'resolved';
  testIssue.resolutionNotes =
    'जलवाहिनी दुरुस्ती पूर्ण करण्यात आली असून मुख्य व्हॉल्व्ह बदलण्यात आला आहे. पाणी पुरवठा पूर्ववत सुरू झाला आहे (दाब: १.८ बार).';
  testIssue.resolutionNotesHistory = [
    {
      note: 'जलवाहिनी दुरुस्ती सुरू केली.',
      editedBy: userMap['officer.water.qa@raise.local']._id,
      editedAt: new Date(Date.now() - 12 * 3600000),
    },
    {
      note: testIssue.resolutionNotes,
      editedBy: userMap['officer.water.qa@raise.local']._id,
      editedAt: new Date(Date.now() - 2 * 3600000),
    },
  ];
  testIssue.afterPhotos = [
    {
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
      filename: 'valve_replacement_verified.jpg',
      mimeType: 'image/jpeg',
    },
  ];
  testIssue.statusTimeline.push({
    status: 'resolved',
    note: 'काम पूर्ण - पाणी पुरवठा सुरळीत.',
    updatedBy: userMap['officer.water.qa@raise.local']._id,
    updatedAt: new Date(Date.now() - 2 * 3600000),
  });
  await testIssue.save();
  console.log('  ✓ Water Officer Rajesh Kulkarni resolved grievance with photo proof & note');

  // ==========================================
  // STEP 5: Simulate Domain 2: Digital Gram Sabha & Deliberations
  // ==========================================
  console.log('\n[6/10] Simulating Domain 2: Digital Gram Sabha & Deliberations...');

  // Rural Topic: Hinjawadi Water Harvesting Budget
  let ruralTopic = await TownhallTopic.findOne({
    title: 'हिंजवडी ग्रामपंचायत - २०२६-२७ पाणी साठवण व पुनर्वापर कृती आराखडा',
  });

  if (!ruralTopic) {
    ruralTopic = await TownhallTopic.create({
      title: 'हिंजवडी ग्रामपंचायत - २०२६-२७ पाणी साठवण व पुनर्वापर कृती आराखडा',
      type: 'gram_sabha_agenda',
      authorType: 'official',
      authorId: userMap['officer.water.qa@raise.local']._id,
      officeId: gpOffice._id,
      jurisdictionId: hinjawadiJur._id,
      settlementType: 'rural_panchayat',
      villageOrWard: 'Hinjawadi',
      summary:
        'हिंजवडी ग्रामपंचायतीच्या आगामी वर्षासाठी भूजल पुनर्भरण, वाणिज्यिक टँकर नियंत्रण आणि शुद्ध पिण्याचे पाणी पुरवठा या संदर्भातील वैधानिक ठराव व ग्रामसभा अजेंडा.',
      status: 'active',
      clauses: [
        {
          clauseId: 'clause-1',
          title: 'कलम १: शेतजमीन व गृहनिर्माण सोसायट्यांसाठी भूजल पुनर्भरण विहीर अनुदान',
          text: 'ग्रामपंचायत हद्दीतील गृहनिर्माण सोसायट्यांना व शेतकऱ्यांना पर्जन्यजल संचयन (RWH) यंत्रणेसाठी ५०% अनुदान देण्यात येईल.',
          voteUp: 18,
          voteDown: 2,
        },
        {
          clauseId: 'clause-2',
          title: 'कलम २: आयटी पार्क परिसरातील टँकर पाणी उपशावर डिजिटल फ्लो-मीटर व कर आकारणी',
          text: 'व्यावसायिक टँकर मालकांना प्रत्येक कूपनलिकेवर डिजिटल मीटर बसवणे बंधनकारक राहील आणि प्रति १००० लिटर नियत दर आकारला जाईल.',
          voteUp: 34,
          voteDown: 5,
        },
        {
          clauseId: 'clause-3',
          title: 'कलम ३: गावठाण चौकात स्वयंचलित शुद्ध पिण्याच्या पाण्याचे वॉटर एटीएम केंद्र',
          text: 'गावठाणातील रहिवासी आणि स्थलांतरित कामगारांसाठी प्रति लिटर २० पैसे दराने २४ तास शुद्ध आरओ पाणी पुरवठा केंद्र सुरू करणे.',
          voteUp: 45,
          voteDown: 1,
        },
      ],
      officialResponse: {
        text: 'ग्रामसभेच्या बहुमताचा आदर करून कलम २ मधील डिजिटल फ्लो मीटरचा ठराव एकमुखाने मंजूर करण्यात आला आहे. निविदा प्रक्रिया पुढील आठवड्यात प्रसिद्ध केली जाईल.',
        respondedAt: new Date(),
        respondedByOfficeId: gpOffice._id,
        respondedByUserId: userMap['officer.water.qa@raise.local']._id,
      },
    });
    console.log('  ✓ Created Rural Gram Sabha Deliberation with 3 clauses & official response');
  }

  // Seed Feedback & Amendments on Rural Topic
  const existingFeedback = await TownhallFeedback.find({ topicId: ruralTopic._id });
  if (existingFeedback.length === 0) {
    await TownhallFeedback.create([
      {
        topicId: ruralTopic._id,
        clauseId: 'clause-2',
        userId: userMap['citizen.rural.qa@raise.local']._id,
        type: 'amendment',
        content:
          'कलम २ मध्ये दुरुस्ती: डिजिटल मीटरचे रिडिंग प्रत्येक आठवड्याला ग्रामपंचायतीच्या सार्वजनिक पोर्टलवर खुले दिसावे.',
        upvotes: 12,
        upvotedUserIds: [userMap['citizen.qa@raise.local']._id, userMap['citizen2.qa@raise.local']._id],
        isPreModerated: true,
      },
      {
        topicId: ruralTopic._id,
        clauseId: 'clause-3',
        userId: userMap['citizen.qa@raise.local']._id,
        type: 'support',
        content: 'गावठाण चौकातील आरओ वॉटर एटीएम अत्यंत आवश्यक आहे. ज्येष्ठ नागरिकांसाठी विशेष सोय करावी.',
        upvotes: 8,
        upvotedUserIds: [userMap['citizen.rural.qa@raise.local']._id],
        isPreModerated: true,
      },
      {
        topicId: ruralTopic._id,
        clauseId: 'clause-2',
        userId: userMap['citizen2.qa@raise.local']._id,
        type: 'concern',
        content:
          'Ensure commercial tanker operators cannot tamper with telemetry meters during nocturnal hours.',
        upvotes: 15,
        upvotedUserIds: [userMap['citizen.qa@raise.local']._id],
        isPreModerated: true,
      },
    ]);
    console.log('  ✓ Seeded citizen amendments, concerns & feedback with community upvotes');
  }

  // Urban Topic: Ward 12 Municipal Deliberation
  let urbanTopic = await TownhallTopic.findOne({
    title: 'Ward 12 Nigdi: 2026-27 Solar Streetlights & Green Energy Deliberation',
  });
  if (!urbanTopic) {
    urbanTopic = await TownhallTopic.create({
      title: 'Ward 12 Nigdi: 2026-27 Solar Streetlights & Green Energy Deliberation',
      type: 'ward_budget',
      authorType: 'official',
      authorId: userMap['rep.councillor.qa@raise.local']._id,
      officeId: repOffice._id,
      jurisdictionId: ward12Jur._id,
      settlementType: 'urban_municipal',
      villageOrWard: 'Ward 12 (Nigdi)',
      summary:
        'A comprehensive public deliberation on converting all 450 residential streetlights in Sector 24 & Sector 25 to solar LED fixtures with micro-sensors.',
      status: 'active',
      clauses: [
        {
          clauseId: 'clause-u1',
          title: 'Clause 1: 100% Transition of Secondary Arterial Roads to Solar LED',
          text: 'Installation of high-efficiency 60W solar streetlights with 48-hour battery backup on all ward lanes.',
          voteUp: 42,
          voteDown: 3,
        },
        {
          clauseId: 'clause-u2',
          title: 'Clause 2: Public Real-time Energy Monitoring Kiosk',
          text: 'A public digital dashboard displaying total units generated, carbon offset, and municipal power bill savings.',
          voteUp: 56,
          voteDown: 0,
        },
      ],
    });
    console.log('  ✓ Created Urban Municipal Deliberation for Ward 12');
  }

  // ==========================================
  // STEP 6: Simulate Domain 4: Representative Oversight
  // ==========================================
  console.log('\n[7/10] Simulating Domain 4: Elected Representative Oversight...');

  // Representative Ask (Constituent inquiry on issue)
  let repAsk = await RepresentativeAsk.findOne({
    issueId: testIssue._id,
    representativeProfileId: repProfile._id,
  });

  if (!repAsk) {
    repAsk = await RepresentativeAsk.create({
      issueId: testIssue._id,
      representativeProfileId: repProfile._id,
      officeId: repOffice._id,
      userId: userMap['citizen.qa@raise.local']._id,
      role: 'ward_councillor',
      status: 'taken_up',
      acknowledgedAt: new Date(Date.now() - 24 * 3600000),
      takenUpAt: new Date(Date.now() - 20 * 3600000),
      slaDeadline: new Date(Date.now() + 52 * 3600000),
    });
    console.log('  ✓ Rahul Shinde (Councillor) took up citizen ask for Ward 12 water grievance');
  }

  // Representative Update (Public record with citizen confirmation)
  let repUpdate = await RepresentativeUpdate.findOne({
    representativeProfileId: repProfile._id,
    title: 'प्रभाग १२ जलवाहिनी पाहणी व कार्यकारी अभियंता यांच्यासोबत संयुक्त बैठक',
  });

  if (!repUpdate) {
    repUpdate = await RepresentativeUpdate.create({
      representativeProfileId: repProfile._id,
      officeId: repOffice._id,
      authorId: userMap['rep.councillor.qa@raise.local']._id,
      title: 'प्रभाग १२ जलवाहिनी पाहणी व कार्यकारी अभियंता यांच्यासोबत संयुक्त बैठक',
      body: 'सेक्टर २४ मधील कमी दाबाच्या समस्येबाबत महापालिका पाणी पुरवठा विभागाच्या अधिकाऱ्यांसोबत प्रत्यक्ष पाहणी केली आणि नवीन व्हॉल्व्ह बसवून पाणी पुरवठा सुरळीत केला.',
      category: 'water',
      jurisdictionId: ward12Jur._id,
      status: 'published',
      isSelfReported: true,
      confirmedCount: 14,
      confirmedUserIds: [userMap['citizen.qa@raise.local']._id, userMap['citizen2.qa@raise.local']._id],
      disputedCount: 0,
    });
    console.log('  ✓ Representative Update published on public record with verified constituent confirms');
  }

  // ==========================================
  // STEP 7: Simulate Domain 5: Platform Administration & Governance
  // ==========================================
  console.log('\n[8/10] Simulating Domain 5 & 6: Platform Administration & Governance...');

  // Content Moderation Record
  let modReport = await ModerationReport.findOne({ details: 'QA Test: Commercial marketing spam flagged' });
  if (!modReport) {
    modReport = await ModerationReport.create({
      targetType: 'issue',
      targetId: testIssue._id,
      reportedBy: userMap['citizen2.qa@raise.local']._id,
      reason: 'spam',
      details: 'QA Test: Commercial marketing spam flagged',
      status: 'action_taken',
      reviewerId: userMap['admin.qa@raise.local']._id,
      reviewerNotes: 'Verified non-civic link and removed offending promotional text.',
      actionTaken: 'redact_pii',
    });
    console.log('  ✓ Seeded Content Moderation case with administrative action taken');
  }

  // Model Code of Conduct Freeze Window (Election Freeze)
  let freezeWin = await FreezeWindow.findOne({ reason: 'General Municipal Corporation Elections 2026' });
  if (!freezeWin) {
    freezeWin = await FreezeWindow.create({
      jurisdictionId: ward12Jur._id,
      roles: ['ward_councillor', 'mla'],
      freezeStart: new Date('2026-11-01'),
      freezeEnd: new Date('2026-12-05'),
      reason: 'General Municipal Corporation Elections 2026',
      createdBy: userMap['admin.qa@raise.local']._id,
      isActive: true,
    });
    console.log('  ✓ Seeded Election Freeze Window (Model Code of Conduct safeguard)');
  }

  // ==========================================
  // STEP 8: Simulate Domain 8: Civic Donations & Billing
  // ==========================================
  console.log('\n[9/10] Simulating Domain 8: Civic Donations & Receipts...');

  let sampleDonation = await Donation.findOne({ receiptNumber: 'DON-2026-QA-001' });
  if (!sampleDonation) {
    sampleDonation = await Donation.create({
      donorUserId: userMap['citizen.qa@raise.local']._id,
      donorName: 'Kavita Joshi',
      donorEmail: 'citizen.qa@raise.local',
      amountPaise: 100000, // ₹1,000
      currency: 'INR',
      type: 'one_time',
      status: 'paid',
      fund: 'general',
      anonymous: false,
      showOnSupportersList: true,
      provider: 'mock',
      providerPaymentId: 'pay_mock_raise_qa_123',
      receiptNumber: 'DON-2026-QA-001',
      receipt80G: true,
      panMasked: 'ABCDE****F',
      declarations: {
        notPoliticalEntity: true,
        notForeign: true,
      },
      paidAt: new Date(),
    });
    console.log('  ✓ Seeded voluntary civic donation receipt (DON-2026-QA-001, ₹1,000)');
  }

  // ==========================================
  // STEP 9: Summary & Complete
  // ==========================================
  console.log('\n[10/10] Pre-Deployment Simulation Completed Successfully!');
  console.log('--------------------------------------------------------');
  console.log('ALL TEST ACCOUNTS READY WITH PASSWORD: Raise2026!\n');
  console.log('1. Citizen Lead (Marathi):       citizen.qa@raise.local');
  console.log('2. Citizen Backer (English):     citizen2.qa@raise.local');
  console.log('3. Rural Citizen (Hindi):        citizen.rural.qa@raise.local');
  console.log('4. Water Dept Officer (Marathi): officer.water.qa@raise.local');
  console.log('5. Ward Councillor (Marathi):    rep.councillor.qa@raise.local');
  console.log('6. Platform Admin (English):     admin.qa@raise.local');
  console.log('========================================================\n');

  await mongoose.disconnect();
}

runPreDeploymentSimulation().catch((err) => {
  console.error('❌ Simulation Error:', err);
  process.exit(1);
});
