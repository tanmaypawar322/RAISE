import { MarketingTranslations } from './types';

export const en: MarketingTranslations = {
  nav: {
    home: 'Home',
    howItWorks: 'How It Works',
    forCitizens: 'For Citizens',
    forOffices: 'For Offices',
    privacy: 'Privacy & Safety',
    faq: 'FAQ',
    about: 'About',
    contact: 'Contact',
    signIn: 'Sign In',
    getStarted: 'Get Started',
    requestOfficeAccess: 'Request Office Access',
    officialSignIn: 'Official Sign In',
  },

  footer: {
    tagline: 'Report • Amplify • Inform • Solve • Escalate',
    rights: '© 2026 RAISE Platform. Non-profit public interest civic initiative.',
    initiativeNotice: 'RAISE is an independent citizen voice platform. It is not affiliated with or run by any political party.',
    linksTitle: 'Platform',
    legalTitle: 'Trust & Legal',
    terms: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    communityGuidelines: 'Community Guidelines',
    grievanceOfficer: 'Grievance Redressal',
    openApp: 'Open App',
  },

  hero: {
    badge: 'RAISE • Report • Amplify • Inform • Solve • Escalate',
    title: 'Every Citizen’s Voice.',
    highlight: 'Every Authority’s Duty.',
    description:
      'RAISE connects citizens directly to public governance: report local grievances with verified evidence, amplify neighborhood backing, alert responsible departments, verify resolutions, and escalate when ignored.',
    primaryCta: 'Get Started (Free)',
    secondaryCta: 'Sign In',
    officialHelperPrefix: 'Municipal official or authorized agency partner?',
    officialHelperLink: 'Request Office Access',
    officialHelperOr: 'or',
    officialHelperSignIn: 'Sign In Here',
    trustPillars: {
      freeTitle: '100% Free',
      freeSub: 'Zero fees for citizens',
      speedTitle: '<60s Report',
      speedSub: 'Photo, GPS & voice note',
      policyTitle: '1-Person 1-Raise',
      policySub: 'Resistant to artificial brigading',
      neutralTitle: 'Public Offices',
      neutralSub: 'Focus on systems, not individuals',
    },
    ctaTrustNotice: 'Free for citizens. No advertisements. Your email and phone are never publicly disclosed.',
  },

  howItWorks: {
    title: 'The 5-Stage Accountability Cycle',
    subtitle:
      'From the moment a grievance is identified to confirmed physical resolution, RAISE provides a structured, public timeline with built-in escalation.',
    detailedCta: 'Read the detailed lifecycle breakdown →',
    steps: [
      {
        letter: 'R',
        word: 'Report',
        title: 'Document with Ground Evidence',
        description:
          'Take a geo-tagged photo, record a voice note in your native language, and pin the precise location in under 60 seconds.',
      },
      {
        letter: 'A',
        word: 'Amplify',
        title: 'Neighborhood Corroboration',
        description:
          'Neighbors support the issue using 1-person-1-raise. Community backing elevates urgency on locality feeds without artificial manipulation.',
      },
      {
        letter: 'I',
        word: 'Inform',
        title: 'Designated Office Alert',
        description:
          'The platform alerts the responsible ward office or utility department profile and starts a transparent public response clock.',
      },
      {
        letter: 'S',
        word: 'Solve',
        title: 'Verified Resolution Proof',
        description:
          'Offices acknowledge the issue and post progress. An issue is only marked resolved when backed by mandatory after-photos and confirmed by local citizens.',
      },
      {
        letter: 'E',
        word: 'Escalate',
        title: 'Higher Authority & Statutory Escalation',
        description:
          'If an issue is neglected past the statutory response clock, it automatically climbs the hierarchy, offering 1-tap pre-filled CPGRAMS and RTI drafts.',
      },
    ],
  },

  splits: {
    citizenTitle: 'For Citizens & Residents',
    citizenDesc:
      'Report broken roads, contaminated water, overflowing bins, or utility hazards in under a minute. Track your ward office’s response in real time.',
    citizenCta: 'Explore Citizen Features',
    officeTitle: 'For Municipal Offices & Utilities',
    officeDesc:
      'Build verifiable public trust. Acknowledge complaints, share work progress, coordinate field teams, and prove resolution with photo evidence.',
    officeCta: 'Explore Office Features',
  },

  principles: {
    badge: 'Core Principles',
    title: 'Our Non-Negotiable Charter',
    subtitle: 'Designed to preserve public trust, prevent political capture, and safeguard citizens.',
    items: [
      {
        title: 'Strict Non-Partisanship',
        description:
          'Zero political party funds, zero campaign endorsements. The platform carries citizen voices without political bias or favoritism.',
      },
      {
        title: 'Public Offices, Not Individuals',
        description:
          'Grievances target designated municipal departments and public offices, strictly prohibiting personal attacks or harassment of individual officers.',
      },
      {
        title: 'Evidence Over Noise',
        description:
          'Issues require verified geographic locations and photo or audio evidence. Locality corroborate ensures only genuine community grievances surface.',
      },
      {
        title: 'Safe for Citizens',
        description:
          'Pseudonymous display names, optional anonymous reporting, and automatic EXIF/GPS scrubbing from media files protect citizen privacy.',
      },
      {
        title: 'Native Language First',
        description:
          'Designed for intuitive use in Marathi, Hindi, and English with native audio voice reporting for first-time smartphone users.',
      },
      {
        title: 'Radical Transparency',
        description:
          'SLA response times, moderation actions, and resolution audit records are published openly for community review.',
      },
    ],
  },

  screenshots: {
    badge: 'Platform Preview',
    title: 'Experience RAISE in Action',
    subtitle: 'A clean, calm, and distraction-free interface built for citizens and public authorities.',
    sampleDisclaimer: '[SAMPLE DATA FOR ILLUSTRATION ONLY — PROPRIETARY PLATFORM UI]',
    screen1Title: 'Rapid Grievance Reporting',
    screen1Desc: 'Capture photo evidence, record audio in your dialect, and tag municipal categories in under 60 seconds.',
    screen2Title: 'Hyperlocal Ward Feed & Map',
    screen2Desc: 'Discover civic issues in your neighborhood, back existing reports, and monitor active response clocks.',
    screen3Title: 'Official Department Work Queue',
    screen3Desc: 'Designated field offices review incoming grievances, schedule repairs, and publish verified resolution proof.',
  },

  forCitizens: {
    badge: 'Citizen Experience',
    title: 'Empowering Every Neighborhood Resident',
    subtitle: 'A free, secure civic platform built to turn local frustration into verified administrative action.',
    features: [
      {
        title: 'Under 60-Second Reporting',
        desc: 'Take a picture, record an audio description in Marathi, Hindi, or English, and let GPS pinpoint the issue.',
      },
      {
        title: '1-Person 1-Raise Verification',
        desc: 'Support grievances raised by your neighbors to demonstrate authentic community urgency without spam.',
      },
      {
        title: 'Public SLA Response Clock',
        desc: 'Watch the clock count down as your local ward office acknowledges the grievance and commits to a repair timeline.',
      },
      {
        title: '7-Day Citizen Dispute Window',
        desc: 'An issue is not resolved until you and your neighbors confirm the work. Dispute incomplete repairs with fresh photo evidence.',
      },
      {
        title: '1-Tap Escalation Tools',
        desc: 'If deadlines are ignored, generate pre-formatted CPGRAMS central grievance text and Right to Information (RTI) query drafts with one tap.',
      },
    ],
    costTitle: 'Free for All Citizens — Forever',
    costDesc: 'RAISE never charges citizens to report issues, back grievances, or track public responses. There are no paywalls or premium tiers.',
    privacyTitle: 'Pseudonymous & Protected',
    privacyDesc:
      'You choose your public display name. Your phone number and email are never shown to the public or other users. EXIF location metadata is stripped from photos before publication.',
    moderationTitle: 'Civil & Constructive Community Rules',
    moderationDesc:
      'Our moderation system prevents hate speech, defamation of individual workers, commercial promotions, and partisan political bickering.',
    ctaTitle: 'Ready to improve your neighborhood?',
    ctaDesc: 'Create a free account in 30 seconds and raise your first civic issue today.',
    ctaButton: 'Create Free Citizen Account',
  },

  forOffices: {
    badge: 'Municipal & Agency Portal',
    title: 'Tools for Responsive Public Administration',
    subtitle: 'Help your department demonstrate efficiency, manage public feedback, and build enduring citizen trust.',
    benefits: [
      {
        title: 'Verifiable Public Record',
        desc: 'Showcase your department’s responsiveness with transparent metrics and publicly verified completion photos.',
      },
      {
        title: 'Automated Routing & Categorization',
        desc: 'Grievances in your jurisdiction are automatically classified by category (roads, water, sanitation, electricity, health).',
      },
      {
        title: 'Direct Community Communication',
        desc: 'Publish official progress notes, notify residents of scheduled maintenance, and clear up misunderstandings directly.',
      },
      {
        title: 'Structured Escalation Shield',
        desc: 'Meet your department’s statutory response deadlines and prevent grievances from escalating to central grievance portals.',
      },
    ],
    costTitle: 'Zero Cost for Official Response',
    costDesc:
      'Public offices and authorities can claim their profiles, review grievances, and post official updates completely free of charge. Optional advanced workflow tools may be offered later.',
    verificationTitle: 'Rigorous Identity Verification',
    verificationDesc:
      'Access is strictly verified. Officials must submit official work credentials and undergo review before administrative rights are granted.',
    contractorTitle: 'Authorized Agency & Contractor Access',
    contractorDesc:
      'Third-party contractors and maintenance agencies can request partnered access under their supervising municipal department to post repair updates directly.',
    ctaButton: 'Request Office Access',
    signInLink: 'Official Sign In →',
  },

  privacy: {
    badge: 'Privacy & Safety Charter',
    title: 'Your Privacy Is Built Into the Architecture',
    subtitle: 'We collect the bare minimum necessary to verify authentic human civic voices.',
    collectedTitle: 'What We Collect (Data Minimization)',
    collectedItems: [
      'Account credentials: email address or phone number (hashed and encrypted for authentication).',
      'Display name: a public nickname of your choice (real name is never required).',
      'Civic content: photos, audio voice notes, and descriptions of reported civic issues.',
      'Approximate location: geographic coordinates of the reported civic grievance.',
    ],
    neverPublicTitle: 'What is Strictly Kept Private',
    neverPublicItems: [
      'Your phone number and email address are never displayed publicly.',
      'Your private residence location is never published; only the grievance location is shown.',
      'Photo EXIF metadata (device serials, camera settings, embedded GPS) is automatically scrubbed.',
      'Your private data is never sold, shared with commercial advertisers, or rented to data brokers.',
    ],
    exifTitle: 'Automatic EXIF & Location Scrubbing',
    exifDesc:
      'When you upload photos, our processing pipeline strips all embedded device and sensor metadata before storing the image, preventing inadvertent privacy leaks.',
    deletionTitle: 'Right to Erasure & Account Deletion',
    deletionDesc:
      'You can request complete account deletion at any time from your settings. Personal identifiers are permanently purged from our active databases.',
    moderationTitle: 'Community Moderation & Appeals',
    moderationDesc:
      'Any user can flag inappropriate content. Flagged reports undergo neutral review, and authors receive a clear reason and opportunity to appeal moderation decisions.',
    adsTitle: 'Zero Advertising, Zero Data Monetization',
    adsDesc:
      'RAISE is funded through philanthropic and public-interest channels, never through targeted digital advertising or behavioral tracking.',
  },

  faq: {
    badge: 'Frequently Asked Questions',
    title: 'Everything You Need to Know About RAISE',
    subtitle: 'Clear, direct answers about how the platform functions, who runs it, and what to expect.',
    moreQuestionsText: 'Have a specific question not answered here?',
    contactLinkText: 'Get in touch with our team →',
    items: [
      {
        question: 'Is RAISE completely free to use?',
        answer:
          'Yes. RAISE is 100% free for all citizens. There are no fees to register, report issues, support grievances, or track administrative responses.',
      },
      {
        question: 'Who can see my real name or phone number?',
        answer:
          'Nobody. You choose a public display name or nickname. Your phone number and email address are encrypted and never shown to other users, government offices, or the public.',
      },
      {
        question: 'Can I report civic issues anonymously?',
        answer:
          'Yes. When creating an issue, you can select the anonymous option so that your report shows as submitted by a Verified Neighbor without any username attached.',
      },
      {
        question: 'What happens if a municipal office ignores a grievance?',
        answer:
          'Every reported issue carries an SLA countdown clock based on statutory department norms. If an office fails to acknowledge or act within the allotted time, the issue automatically escalates to senior supervisory bodies, and citizens can generate pre-filled CPGRAMS and RTI drafts.',
      },
      {
        question: 'How does RAISE prevent fake or malicious reports?',
        answer:
          'Issues require verified geographic coordinates, date stamps, and photo evidence. Furthermore, neighboring residents corroborate issues via the 1-person-1-raise rule, and abusive or defamatory submissions are swiftly moderated.',
      },
      {
        question: 'Is RAISE a government-run website or portal?',
        answer:
          'No. RAISE is an independent, non-partisan civic technology platform created in the public interest. It is not owned, funded, or operated by any government department or political party.',
      },
      {
        question: 'Who runs and manages the RAISE platform?',
        answer:
          'RAISE is built and stewarded by an independent civic technology initiative committed to transparent, responsive urban governance and open accountability.',
      },
      {
        question: 'How do municipal offices and departments join?',
        answer:
          'Department officers and agency contractors submit a verified request at /office/request-access with official identification. Once administrative credentials are authenticated, the office is granted access to its jurisdiction’s work queue.',
      },
      {
        question: 'Which regional languages are supported?',
        answer:
          'The platform fully supports Marathi, Hindi, and English across the entire interface, with support for native audio voice notes in regional languages.',
      },
      {
        question: 'What geographic areas are currently active?',
        answer:
          'The initial pilot focuses on municipal wards in Maharashtra, starting with Pimpri-Chinchwad and Pune regions, with plans to expand to further cities progressively.',
      },
      {
        question: 'How do I delete my account and personal data?',
        answer:
          'You can request account deletion at any time from your account settings. This permanently wipes your contact details and session records from active platform storage.',
      },
      {
        question: 'How do I report abuse, harassment, or inaccurate reports?',
        answer:
          'Every issue and comment features a "Report Content" option. Submissions that violate community rules (such as personal attacks or hate speech) are reviewed and acted upon within 24 to 36 hours.',
      },
      {
        question: 'What is the 1-Person One Raise rule?',
        answer:
          'Each registered user can support ("raise") a particular grievance exactly once. This prevents automated bots or coordinated groups from artificially inflating numbers.',
      },
      {
        question: 'How does the statutory escalation (CPGRAMS / RTI) work?',
        answer:
          'If an issue remains unresolved past the escalation deadline, RAISE formats the complete grievance timeline, evidence photos, and department logs into pre-filled legal drafts suitable for submission to central grievance cells or RTI queries.',
      },
    ],
  },

  about: {
    badge: 'About RAISE',
    title: 'Rebuilding Public Trust in Local Governance',
    subtitle: 'Bridging the divide between neighborhood grievances and administrative action through radical transparency.',
    missionTitle: 'Our Mission',
    missionDesc:
      'We believe responsive governance begins with accessible evidence. By enabling citizens to document issues easily and giving responsible offices a transparent platform to prove their work, RAISE fosters constructive accountability without political hostility.',
    howWeRunTitle: 'Governance & Operational Integrity',
    howWeRunDesc:
      'RAISE is operated with strict adherence to non-partisanship. We maintain zero political affiliations, accept no party contributions, and prohibit political advertisements across our services.',
    fundingTitle: 'Funding & Sustainability',
    fundingDesc:
      'We are supported through philanthropic grants and civic public-interest endowments. A full audit of operational expenses and contributions will be published openly upon public release.',
    charterTitle: 'Our Operational Commitments',
    charterItems: [
      '100% Free for citizens to report, back, and track civic issues.',
      'No sale of user data or commercial behavioral tracking.',
      'Neutral focus on public offices and statutory services, never individual government employees.',
      'Public transparency regarding SLA performance and resolution evidence.',
    ],
  },

  contact: {
    badge: 'Contact & Support',
    title: 'Get in Touch With Our Team',
    subtitle: 'We are here to answer questions from citizens, community groups, and municipal authorities.',
    supportEmailTitle: 'General & Support Inquiries',
    supportEmailDesc: 'For platform support, bug reports, or partnership questions, email us at:',
    grievanceOfficerTitle: 'Statutory Grievance Officer',
    grievanceOfficerDesc: 'Statutory compliance details for formal grievance redressal under Indian intermediary guidelines.',
    grievanceOfficerConfigPending:
      'Statutory Grievance Officer designation details will be published here upon live public roll-out.',
    legalNotice: 'Legal terms and policies are available directly in the platform footer.',
  },

  notFound: {
    title: 'Page Not Found (404)',
    desc: 'The page you are looking for does not exist or has been moved.',
    homeBtn: 'Return to Home',
    appBtn: 'Open Citizen App',
  },
};
