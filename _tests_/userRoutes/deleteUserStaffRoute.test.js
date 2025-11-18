import { describe, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

import { prisma } from '../../src/users/db/prisma.js';
import { router as deleteUserStaff } from '../../src/users/staffRoutes/deleteUserStaff.js'

import successHandler from '../../middlewares/successHandler.js';
import errorHandler from '../../middlewares/errorHandler.js';
import { signJwt } from '../../src/auth/tokens/signJwt.js';

const app = express();
app.use(express.json());

app.use(successHandler);
app.use('/', deleteUserStaff);
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

function bearer(token) {
	return { Authorization: `Bearer ${token}` };
}

describe('DELETE /users/me - Staff Self Delete', () => {
	describe('✅ Success Cases:', () => {
		it('should allow STAFF to self-delete (200)', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Staff Self',
					age: 23,
					email: 'staff.self@ex.com',
					passwordHash: await bcrypt.hash('Valid@123', 10),
					role: 'STAFF',
				},
			});

			const token = signJwt({ id: user.id, role: user.role });

			const res = await request(app).delete('/users/me').set(bearer(token));

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe('SUCCESSFULLY SELF-DELETED!');
		});
	});

	describe('❌ Error Cases:', () => {
		it('should return 401 when no token is provided (authRequired)', async () => {
			const res = await request(app).delete('/users/me');

			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('Missing Authorization header');
			expect(res.body.field).toBe('authorization');
			expect(res.body.code).toBe('AUTH_MISSING');
		});

		it('should return 404 when token user no longer exists in DB', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Staff Self',
					age: 23,
					email: 'staff.self@ex.com',
					passwordHash: await bcrypt.hash('Valid@123', 10),
					role: 'STAFF',
				},
			});

			const token = signJwt({ id: user.id, role: user.role });

			// Simula token "stale": remove o user antes de chamar a rota
			await prisma.user.delete({ where: { id: user.id } });

			const res = await request(app).delete('/users/me').set(bearer(token));

			expect(res.statusCode).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('USER NOT FOUND!');
			expect(res.body.code).toBe('ERR_USER_NOT_FOUND');
		});

		it('should return 500 when an internal error occurs during delete', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Staff Self',
					age: 23,
					email: 'staff.self@ex.com',
					passwordHash: await bcrypt.hash('Valid@123', 10),
					role: 'STAFF',
				},
			});

			const token = signJwt({ id: user.id, role: user.role });

			jest.spyOn(prisma.user, 'delete').mockImplementation(() => {
				throw new Error('DB Delete Error');
			});

			const res = await request(app).delete('/users/me').set(bearer(token));

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('UNEXPECTED ERROR IN DELETE SELF FUNCTION!');
			expect(res.body.code).toBe('ERR_DELETE_ME_FAILED');
		});
	});
});
