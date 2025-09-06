// prisma/seed.js
// Script to declarete a DEFAULT ADMIN USER

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import AppError from '../middlewares/AppError';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const rawPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !rawPassword) {
    throw new AppError('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD ausentes no .env');
  }

  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(rawPassword, rounds);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'Admin',
    },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      name: 'Admin',
    },
  });

  console.log(`✅ Admin seed pronto: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
