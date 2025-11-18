import request from 'supertest';
import app from '../bridgeUserRouteTest/app.bridge.userToDb';
import { prisma } from '../../src/users/db/prisma.js';

beforeAll(async () => {
	await prisma.$connect();
});

afterAll(async () => {
	await prisma.$disconnect();
});

beforeEach(async () => {
	await prisma.user.deleteMany();
});

describe('Bridge HTTP — success + DB error mapping', () => {
	test('Create a user and response by successHandler', async () => {
		const payload = {
			name: 'Jane',
			email: 'jane@example.com',
			passwordHash: 'hashJane',
			age: 22
		};
		const res = await request(app).post('/users').send(payload);

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			success: true,
			status: 'Success',
			message: 'USER CREATED'
		});
	});

	test('Duplicate email → mapped P2002', async () => {
		await request(app)
			.post('/users')
			.send({ name: 'Jane', email: 'jane@example.com', passwordHash: 'hashJane', age: 22 });

		const dup = await request(app)
			.post('/users')
			.send({ name: 'Another', email: 'jane@example.com', passwordHash: 'x', age: 24 });

		expect(dup.status).toBe(409);
		expect(dup.body).toMatchObject({
			//toEqual requires that the object has to be identic in values and structure. toMatchObjects allows me to compare only some parameters of the object.
			success: false,
			status: 'Error',
			message: 'Email already registered',
			code: 'P2002_DUPLICATE',
			field: 'email'
		});
	});
});
