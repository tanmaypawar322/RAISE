import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isProd = process.env.NODE_ENV === 'production';

// Production safety validations:
if (isProd) {
  if (process.env.OTP_DEV_FIXED_CODE) {
    throw new Error('FATAL SECURITY ERROR: OTP_DEV_FIXED_CODE must never be set in production mode.');
  }
  if (process.env.DEV_SKIP_OFFICIAL_SECOND_FACTOR) {
    throw new Error('FATAL SECURITY ERROR: DEV_SKIP_OFFICIAL_SECOND_FACTOR must never be set in production mode.');
  }
  if (process.env.DEV_MAILBOX === 'true') {
    throw new Error('FATAL SECURITY ERROR: DEV_MAILBOX must never be enabled in production mode.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'raise_super_secret_jwt_key_2026_dev_mode') {
    throw new Error('FATAL SECURITY ERROR: In production, JWT_SECRET must be set to a secure, unique secret.');
  }
  if (!process.env.PHONE_ENCRYPTION_KEY || process.env.PHONE_ENCRYPTION_KEY.length < 32) {
    throw new Error('FATAL SECURITY ERROR: In production, PHONE_ENCRYPTION_KEY must be provided (min 32 bytes).');
  }
  if (!process.env.PHONE_HASH_SECRET) {
    throw new Error('FATAL SECURITY ERROR: In production, PHONE_HASH_SECRET must be provided.');
  }
  if (!process.env.OTP_HASH_SECRET) {
    throw new Error('FATAL SECURITY ERROR: In production, OTP_HASH_SECRET must be provided.');
  }
}

// Public pilot safeguard:
const authAllowEmailPassword = process.env.AUTH_ALLOW_EMAIL_PASSWORD !== 'false';
const authRequireEmailVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true';

if (isProd && authAllowEmailPassword && !authRequireEmailVerification) {
  console.warn(
    '\n********************************************************************************\n' +
      '[PUBLIC-PILOT-SAFEGUARD WARNING] Unverified email sign-ups are enabled in production!\n' +
      'Decide before the public pilot whether to require email verification or a verified phone.\n' +
      '********************************************************************************\n'
  );
}

if (isProd && (process.env.LEGAL_TEXT_STATUS || 'DRAFT_NOT_REVIEWED') === 'DRAFT_NOT_REVIEWED') {
  console.warn(
    '\n********************************************************************************\n' +
      '[LEGAL COMPLIANCE WARNING] LEGAL_TEXT_STATUS is DRAFT_NOT_REVIEWED!\n' +
      'A legal professional must review terms, privacy, and statutory notices before live deployment.\n' +
      '********************************************************************************\n'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  marketingUrl: process.env.MARKETING_URL || 'http://localhost:3001',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raise_db',
  jwtSecret: process.env.JWT_SECRET || 'raise_super_secret_jwt_key_2026_dev_mode',

  // Phone & OTP Cryptography
  phoneEncryptionKey: process.env.PHONE_ENCRYPTION_KEY || 'raise_dev_phone_aes_key_32bytes_min_length_123',
  phoneHashSecret: process.env.PHONE_HASH_SECRET || 'raise_dev_phone_hash_secret_2026',
  otpHashSecret: process.env.OTP_HASH_SECRET || 'raise_dev_otp_hash_secret_2026',
  emailHashSecret: process.env.EMAIL_HASH_SECRET || process.env.PHONE_HASH_SECRET || 'raise_dev_email_hash_secret_2026',
  emailEncryptionKey: process.env.EMAIL_ENCRYPTION_KEY || process.env.PHONE_ENCRYPTION_KEY || 'raise_dev_email_aes_key_32bytes_min_length_123',
  otpDailyCap: parseInt(process.env.OTP_DAILY_CAP || '500', 10),
  otpDevFixedCode: isProd ? undefined : process.env.OTP_DEV_FIXED_CODE,

  // Pluggable SMS Provider: 'console' | 'msg91' | 'whatsapp'
  otpProvider: process.env.OTP_PROVIDER || 'console',
  msg91AuthKey: process.env.MSG91_AUTH_KEY,
  msg91SenderId: process.env.MSG91_SENDER_ID,
  msg91DltTeId: process.env.MSG91_DLT_TE_ID || process.env.MSG91_TEMPLATE_ID,

  // Pluggable Email Provider: 'console' | 'smtp' | 'resend' | 'ses'
  emailProvider: process.env.EMAIL_PROVIDER || 'console',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM || 'no-reply@raise.org',
  passwordResetTtlMinutes: parseInt(process.env.PASSWORD_RESET_TTL_MINUTES || '30', 10),

  // Auth & Pilot Controls
  authAllowEmailPassword,
  authRequireEmailVerification,
  authRequirePhoneToRaise: process.env.AUTH_REQUIRE_PHONE_TO_RAISE === 'true',
  newAccountDailyActionLimit: parseInt(process.env.NEW_ACCOUNT_DAILY_ACTION_LIMIT || '20', 10),

  // Dev-only testing flags (strictly blocked in production above)
  devMailbox: !isProd && process.env.DEV_MAILBOX === 'true',
  devSkipOfficialSecondFactor: !isProd && process.env.DEV_SKIP_OFFICIAL_SECOND_FACTOR === 'true',

  // Bot Protection (Cloudflare Turnstile)
  turnstileSecret: process.env.TURNSTILE_SECRET,

  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  localUploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',

  // SLA & Escalation Ladder Settings
  slaScale: (process.env.SLA_SCALE || 'hours') as 'hours' | 'minutes',
  escalationCron: process.env.ESCALATION_CRON || '*/15 * * * *',
  gpsRadiusMeters: parseInt(process.env.GPS_RADIUS_METERS || '150', 10),
  confirmWindowDays: parseInt(process.env.CONFIRM_WINDOW_DAYS || '7', 10),

  // Phase 4: Notification Controls & Job Queue
  notificationsEnabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
  smsDailyCap: parseInt(process.env.SMS_DAILY_CAP || process.env.OTP_DAILY_CAP || '500', 10),
  redisUrl: process.env.REDIS_URL,

  // Phase 5: Moderation & Legal Transparency
  moderationProvider: process.env.MODERATION_PROVIDER || 'rules',
  autoHoldReportThreshold: parseInt(process.env.AUTO_HOLD_REPORT_THRESHOLD || '5', 10),
  orgLegalName: process.env.ORG_LEGAL_NAME || 'RAISE Civic Trust Foundation',
  orgAddress: process.env.ORG_ADDRESS || 'Sector 24, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune 411044',
  grievanceOfficerName: process.env.GRIEVANCE_OFFICER_NAME || 'Adv. Radhika Deshmukh',
  grievanceOfficerEmail: process.env.GRIEVANCE_OFFICER_EMAIL || 'grievance@raise.org',
  grievanceOfficerPhone: process.env.GRIEVANCE_OFFICER_PHONE || '+91 20 2742 5555',
  legalTextStatus: process.env.LEGAL_TEXT_STATUS || 'DRAFT_NOT_REVIEWED',
};

