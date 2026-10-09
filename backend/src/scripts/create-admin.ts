import readline from 'readline';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

function parseArgs(): { email: string } {
  const args = process.argv.slice(2);
  let email = '';
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--email' || args[i] === '-e') && args[i + 1]) {
      email = args[i + 1].trim();
      break;
    }
  }

  if (!email) {
    console.error('\nError: Missing required --email argument.');
    console.error('Usage: npm run create-admin -- --email <admin-email>\n');
    process.exit(1);
  }

  const emailParsed = z.string().email().safeParse(email);
  if (!emailParsed.success) {
    console.error(`\nError: "${email}" is not a valid email address.\n`);
    process.exit(1);
  }

  return { email: email.toLowerCase() };
}

function askPassword(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter admin password (min 12 characters): ', (pass) => {
      rl.close();
      resolve(pass.trim());
    });
  });
}

export async function createAdmin(email: string, password: string): Promise<void> {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters.');
  }

  await mongoose.connect(config.mongoUri);

  const passwordHash = await bcrypt.hash(password, 12);
  let user = await User.findOne({ email });

  if (user) {
    user.role = 'admin';
    user.passwordHash = passwordHash;
    user.isOfficialVerified = true;
    user.isActive = true;
    await user.save();
    console.log(`[Success] Existing user "${email}" elevated to Platform Administrator.`);
  } else {
    user = await User.create({
      name: 'Platform Administrator',
      email,
      passwordHash,
      displayName: 'System Admin',
      role: 'admin',
      isOfficialVerified: true,
      isActive: true,
      language: 'en',
    });
    console.log(`[Success] New Platform Administrator account created for "${email}".`);
  }

  await mongoose.disconnect();
}

async function main() {
  try {
    const { email } = parseArgs();
    const password = await askPassword();

    if (password.length < 12) {
      console.error('\nError: Password must be at least 12 characters long.\n');
      process.exit(1);
    }

    console.log(`\nConnecting to database and creating admin: ${email}...`);
    await createAdmin(email, password);
    process.exit(0);
  } catch (err: any) {
    console.error(`\nOperation failed: ${err.message}\n`);
    process.exit(1);
  }
}

// Execute when invoked directly from CLI
if (process.argv[1]?.includes('create-admin')) {
  main();
}
