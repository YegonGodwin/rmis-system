import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import User from '../models/user.js';

config();

const run = async () => {
  const username = process.argv[2] || process.env.SEED_ADMIN_USERNAME;
  const email = process.argv[3] || process.env.SEED_ADMIN_EMAIL;
  const password = process.argv[4] || process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.argv[5] || process.env.SEED_ADMIN_FULLNAME || 'System Admin';

  if (!username || !email || !password) {
    console.error('Usage: node scripts/seedAdmin.js <username> <email> <password> [fullName]');
    process.exit(1);
  }

  await connectDB();

  const normalizedUsername = String(username).toLowerCase().trim();
  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });

  if (existing) {
    existing.role = 'Admin';
    existing.status = 'Active';
    existing.fullName = existing.fullName || fullName;
    if (!existing.email) existing.email = normalizedEmail;

    if (password) {
      existing.passwordHash = await bcrypt.hash(String(password), 10);
    }

    await existing.save();
    console.log(`Updated existing user as admin: ${existing.username} (${existing.email})`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const user = await User.create({
    username: normalizedUsername,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    role: 'Admin',
    status: 'Active',
    passwordHash,
  });

  console.log(`Created admin user: ${user.username} (${user.email})`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
