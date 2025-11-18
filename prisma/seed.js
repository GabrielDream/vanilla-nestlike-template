// prisma/seed.js
// Script to declarete a DEFAULT ADMIN USER
// RODAR npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
//import AppError from '../middlewares/AppError';

const prisma = new PrismaClient();

async function main() {
	//✅ Verifica se credenciais existem
	const email = (process.env.ADMIN_SEED_EMAIL || '').toLowerCase();
	const rawPassword = process.env.ADMIN_SEED_PASSWORD;

	//✅ Verifica se credenciais existem:
	if (!email || !rawPassword) {
		throw new Error('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD absent in .env file');
	}

	//✅ Define salt rounds seguros
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
			age: 50,
		},
	});

	console.log(`✅ Admin seed created: ${email}`);
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
