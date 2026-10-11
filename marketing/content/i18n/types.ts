export type Language = 'en' | 'mr' | 'hi';

export interface NavContent {
  home: string;
  howItWorks: string;
  forCitizens: string;
  forOffices: string;
  privacy: string;
  faq: string;
  about: string;
  contact: string;
  signIn: string;
  getStarted: string;
  requestOfficeAccess: string;
  officialSignIn: string;
}

export interface FooterContent {
  tagline: string;
  rights: string;
  initiativeNotice: string;
  linksTitle: string;
  legalTitle: string;
  terms: string;
  privacyPolicy: string;
  communityGuidelines: string;
  grievanceOfficer: string;
  openApp: string;
}

export interface HeroContent {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  officialHelperPrefix: string;
  officialHelperLink: string;
  officialHelperOr: string;
  officialHelperSignIn: string;
  trustPillars: {
    freeTitle: string;
    freeSub: string;
    speedTitle: string;
    speedSub: string;
    policyTitle: string;
    policySub: string;
    neutralTitle: string;
    neutralSub: string;
  };
  ctaTrustNotice: string;
}

export interface PillarStep {
  letter: string;
  word: string;
  title: string;
  description: string;
}

export interface HowItWorksSummary {
  title: string;
  subtitle: string;
  steps: PillarStep[];
  detailedCta: string;
}

export interface SplitsContent {
  citizenTitle: string;
  citizenDesc: string;
  citizenCta: string;
  officeTitle: string;
  officeDesc: string;
  officeCta: string;
}

export interface PrincipleItem {
  title: string;
  description: string;
}

export interface PrinciplesContent {
  badge: string;
  title: string;
  subtitle: string;
  items: PrincipleItem[];
}

export interface SampleScreenshotsContent {
  badge: string;
  title: string;
  subtitle: string;
  sampleDisclaimer: string;
  screen1Title: string;
  screen1Desc: string;
  screen2Title: string;
  screen2Desc: string;
  screen3Title: string;
  screen3Desc: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  claimId?: string;
}

export interface FaqPageContent {
  badge: string;
  title: string;
  subtitle: string;
  moreQuestionsText: string;
  contactLinkText: string;
  items: FaqItem[];
}

export interface ForCitizensContent {
  badge: string;
  title: string;
  subtitle: string;
  features: {
    title: string;
    desc: string;
  }[];
  costTitle: string;
  costDesc: string;
  privacyTitle: string;
  privacyDesc: string;
  moderationTitle: string;
  moderationDesc: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaButton: string;
}

export interface ForOfficesContent {
  badge: string;
  title: string;
  subtitle: string;
  benefits: {
    title: string;
    desc: string;
  }[];
  costTitle: string;
  costDesc: string;
  verificationTitle: string;
  verificationDesc: string;
  contractorTitle: string;
  contractorDesc: string;
  ctaButton: string;
  signInLink: string;
}

export interface PrivacyPageContent {
  badge: string;
  title: string;
  subtitle: string;
  collectedTitle: string;
  collectedItems: string[];
  neverPublicTitle: string;
  neverPublicItems: string[];
  exifTitle: string;
  exifDesc: string;
  deletionTitle: string;
  deletionDesc: string;
  moderationTitle: string;
  moderationDesc: string;
  adsTitle: string;
  adsDesc: string;
}

export interface AboutPageContent {
  badge: string;
  title: string;
  subtitle: string;
  missionTitle: string;
  missionDesc: string;
  howWeRunTitle: string;
  howWeRunDesc: string;
  fundingTitle: string;
  fundingDesc: string;
  charterTitle: string;
  charterItems: string[];
}

export interface ContactPageContent {
  badge: string;
  title: string;
  subtitle: string;
  supportEmailTitle: string;
  supportEmailDesc: string;
  grievanceOfficerTitle: string;
  grievanceOfficerDesc: string;
  grievanceOfficerConfigPending: string;
  legalNotice: string;
}

export interface NotFoundContent {
  title: string;
  desc: string;
  homeBtn: string;
  appBtn: string;
}

export interface MarketingTranslations {
  nav: NavContent;
  footer: FooterContent;
  hero: HeroContent;
  howItWorks: HowItWorksSummary;
  splits: SplitsContent;
  principles: PrinciplesContent;
  screenshots: SampleScreenshotsContent;
  forCitizens: ForCitizensContent;
  forOffices: ForOfficesContent;
  privacy: PrivacyPageContent;
  faq: FaqPageContent;
  about: AboutPageContent;
  contact: ContactPageContent;
  notFound: NotFoundContent;
}
