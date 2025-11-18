// _tests_/auth/authRoutes/auth.me.http.test.js
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { prisma } from '../../../src/users/db/prisma.js';
import { signJwt } from '../../../src/auth/tokens/signJwt.js';
import { router as meRouter } from '../../../src/auth/routes/getMeRoute.js';
import successHandler from '../../../middlewares/successHandler.js';
import errorHandler from '../../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use(successHandler);
app.use('/auth', meRouter);
app.use(errorHandler);

beforeAll(async () => {
	await prisma.$connect();
});

afterEach(async () => {
	await prisma.user.deleteMany();
	jest.restoreAllMocks(); //fake actor just for tests.
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe('GET /auth/me', () => {
	it('✅ 200 - should return current user data when token is valid', async () => {
		const user = await prisma.user.create({
			data: {
				name: 'Me Tester',
				age: 25,
				email: 'me@tester.com',
				passwordHash: 'hash',
				role: 'STAFF',
			},
		});

		const token = signJwt({ id: user.id, role: user.role });

		const res = await request(app)
			.get('/auth/me')
			.set('Authorization', `Bearer ${token}`)
			.send();

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toMatchObject({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	});

	it('❌ 401 - should reject when token is missing', async () => {
		const res = await request(app).get('/auth/me').send();

		expect(res.statusCode).toBe(401);
		expect(res.body.success).toBe(false);
	});

	it('❌ 404 - should return 404 if user no longer exists', async () => {
		const fakeToken = signJwt({ id: 'nonexistent-id', role: 'STAFF' });

		const res = await request(app)
			.get('/auth/me')
			.set('Authorization', `Bearer ${fakeToken}`)
			.send();

		expect(res.statusCode).toBe(404);
		expect(res.body.success).toBe(false);
	});
});
