import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

import { prisma } from '../../src/users/db/prisma.js';

// ROUTES
import { router as adminDeleteRouter } from '../../src/users/adminDeleteStaffRoute.js';

// MIDDLEWARES
import successHandler from '../../middlewares/successHandler.js';
import errorHandler from '../../middlewares/errorHandler.js';

// JWT
import { signJwt } from '../../src/auth/tokens/signJwt.js';

const app = express();
app.use(express.json());
app.use(successHandler);

// Mount only the route under test
app.use('/', adminDeleteRouter);

app.use(errorHandler);

// Helpers
async function createUser({ name, age = 25, email, password, role = 'STAFF' }) {
	const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
	const passwordHash = await bcrypt.hash(password, rounds);
	return prisma.user.create({
		data: { name, age, email, passwordHash, role },
	});
}

function bearer(token) {
	return { Authorization: `Bearer ${token}` };
}

describe('User Routes — DELETE /users/:id (ADMIN only)', () => {
	let adminUser, staffUser, otherStaff, otherAdmin;
	let adminToken, staffToken;

	beforeAll(async () => {
		await prisma.$connect();
	});

	beforeEach(async () => {
		// Clean database before each test to ensure deterministic state
		await prisma.user.deleteMany();

		// Seed: 1 ADMIN (requester) + 2 STAFF (targets) + 1 ADMIN (target for forbidden attempt)
		adminUser = await createUser({
			name: 'Root Admin',
			age: 35,
			email: process.env.ADMIN_SEED_EMAIL || 'admin@mission5.local',
			password: process.env.ADMIN_SEED_PASSWORD || 'Admin123!m5',
			role: 'ADMIN',
		});

		staffUser = await createUser({
			name: 'Staff One',
			age: 22,
			email: 'staff1@ex.com',
			password: 'Valid@123',
			role: 'STAFF',
		});

		otherStaff = await createUser({
			name: 'Staff Two',
			age: 28,
			email: 'staff2@ex.com',
			password: 'Valid@123',
			role: 'STAFF',
		});

		otherAdmin = await createUser({
			name: 'Another Admin',
			age: 40,
			email: 'admin2@ex.com',
			password: 'Valid@123',
			role: 'ADMIN',
		});

		// Tokens for requester contexts
		adminToken = signJwt({ id: adminUser.id, role: adminUser.role, email: adminUser.email });
		staffToken = signJwt({ id: staffUser.id, role: staffUser.role, email: staffUser.email });
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		await prisma.user.deleteMany();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe('✅ SUCCESS CASES:', () => {
		it('✅ ADMIN can delete a STAFF by id (200 and removed from DB)', async () => {
			const before = await prisma.user.count();
			// Expect 4 users seeded
			expect(before).toBe(4);

			const res = await request(app).delete(`/users/${staffUser.id}`).set(bearer(adminToken));

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe('SUCCESSFULLY DELETED!');

			const after = await prisma.user.count();
			expect(after).toBe(3);

			const deleted = await prisma.user.findUnique({ where: { id: staffUser.id } });
			expect(deleted).toBeNull();

			// Ensure requester admin still exists
			const stillAdmin = await prisma.user.findUnique({ where: { id: adminUser.id } });
			expect(stillAdmin).not.toBeNull();
		});
	});

	describe('❌ ERROR CASES:', () => {
		it('❌ 401 without token (authRequired)', async () => {
			const res = await request(app).delete(`/users/${otherStaff.id}`);
			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it('❌ 403 when STAFF tries to call admin-only route (allowRoles)', async () => {
			const res = await request(app).delete(`/users/${otherStaff.id}`).set(bearer(staffToken));

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			// Error message depends on your allowRoles implementation; we assert status only
		});

		it('❌ 400 when ID is not a valid UUID', async () => {
			const res = await request(app).delete(`/users/invalid-id-format`).set(bearer(adminToken));

			expect(res.statusCode).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('INVALID USER ID!');
			expect(res.body.code).toBe('ERR_INVALID_ID');
		});

		it('❌ 404 when target user does not exist', async () => {
			// Create a valid UUID-like string (not present in DB)
			const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';
			const res = await request(app).delete(`/users/${fakeUuid}`).set(bearer(adminToken));

			expect(res.statusCode).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('USER NOT FOUND!');
			expect(res.body.code).toBe('ERR_USER_NOT_FOUND');
		});

		it('❌ 403 when ADMIN tries to delete itself via /users/:id', async () => {
			const res = await request(app).delete(`/users/${adminUser.id}`).set(bearer(adminToken));

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('ADMIN CANNOT DELETE ITSELF!');
			expect(res.body.code).toBe('ERR_ADMIN_SELF_DELETE');
		});

		it('❌ 403 when trying to delete an ADMIN user (target is ADMIN)', async () => {
			const res = await request(app).delete(`/users/${otherAdmin.id}`).set(bearer(adminToken));

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('CANNOT DELETE AN ADMIN USER!');
			expect(res.body.code).toBe('ERR_DELETE_ADMIN_BLOCKED');
		});

		it('❌ 500 when an internal error occurs during deletion', async () => {
			// Force prisma.user.delete to throw
			jest.spyOn(prisma.user, 'delete').mockImplementation(() => {
				throw new Error('DB Delete Error');
			});

			const res = await request(app).delete(`/users/${otherStaff.id}`).set(bearer(adminToken));

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('UNEXPECTED ERROR IN ADMIN DELETE FUNCTION!');
			expect(res.body.code).toBe('ERR_ADMIN_DELETE_FAILED');
		});
	});
});
