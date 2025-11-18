import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { prisma } from '../../../src/users/db/prisma.js';
import { router as logoutRouter } from '../../../src/auth/routes/logoutRoute.js';
import { signJwt } from '../../../src/auth/tokens/signJwt.js';

import successHandler from '../../../middlewares/successHandler.js';
import errorHandler from '../../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use(successHandler);
app.use('/auth', logoutRouter);
app.use(errorHandler);

beforeAll(async () => {
	await prisma.$connect();
});

afterEach(async () => {
	await prisma.user.deleteMany();
	jest.restoreAllMocks();
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe('POST /auth/logout', () => {
	it('✅ 200 - should logout with valid token', async () => {
		const user = await prisma.user.create({
			data: {
				name: 'Log Outer',
				age: 12,
				email: 'logout@example.com',
				passwordHash: 'hash',
				role: 'STAFF'
			}
		});

		const token = signJwt({ id: user.id, role: user.role });

		const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`).send();

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('LOGOUT SUCCESSFUL!');
		expect(res.body.data).toMatchObject({ loggedOut: true });
	});

	it('❌ 401 - should return 401 when token is missing', async () => {
		const res = await request(app).post('/auth/logout').send();

		expect(res.statusCode).toBe(401);
		expect(res.body.success).toBe(false);
	});
});
