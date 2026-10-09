import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { PasswordUtil } from '../utils/password.util.js';
import { EmailUtil } from '../utils/email.util.js';
import { SessionService } from '../services/session.service.js';
import { AuditService } from '../services/audit.service.js';
import { config } from '../config/env.js';

function parseArgs(): { email?: string; password?: string } {
  const args = process.argv.slice(2);
  let email: string | undefined;
  let password: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
      i++;
    }
  }

  return { email, password };
}

async function main() {
  const { email, password } = parseArgs();

  if (!email) {
    console.error('Usage: npm run reset-user-password -- --email <email> [--password <newPassword>]');
    process.exit(1);
  }

  const normalizedEmail = EmailUtil.normalize(email);
  const emailHash = EmailUtil.hash(normalizedEmail, config.emailHashSecret);

  console.log(`Connecting to database: ${config.mongoUri}...`);
  await mongoose.connect(config.mongoUri);

  const user = await User.findOne({
    $or: [{ emailHash }, { email: normalizedEmail }],
  });

  if (!user) {
    console.error(`Error: User with email "${email}" not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const tempPassword = password || `Temp_${crypto.randomBytes(6).toString('hex')}!`;
  const passCheck = PasswordUtil.validate(tempPassword);
  if (!passCheck.valid) {
    console.error(`Error: Invalid password - ${passCheck.reason}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.passwordHash = await PasswordUtil.hash(tempPassword);
  user.needsPasswordChange = true;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  await SessionService.revokeAllUserSessions(user._id.toString());

  await AuditService.log({
    actorRole: 'cli',
    action: 'cli_reset_user_password',
    targetType: 'user',
    targetId: user._id,
  });

  console.log('\n======================================================');
  console.log(`Password reset successfully for: ${email}`);
  console.log(`Temporary Password: ${tempPassword}`);
  console.log('User will be forced to change password upon next sign-in.');
  console.log('All active sessions have been invalidated.');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Fatal CLI Error:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
