import { expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

import { prisma } from '../../src/users/db/prisma.js';

// ROUTES
import { router as adminDeleteRouter } from '../../src/users/adminRoutes/adminDeleteAllStaffRoute.js';

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

beforeAll(async () => {
	await prisma.$connect();
});

beforeEach(async () => {
	// Clean database before each test to ensure deterministic state
	await prisma.user.deleteMany();
});

afterEach(async () => {
	jest.restoreAllMocks();
	await prisma.user.deleteMany();
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe('User Routes — DELETE /users/:id (ADMIN only)', () => {
	describe('✅ SUCCESS CASES:', () => {
		it('ADMIN can delete any STAFF by id', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_update_name@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const res = await request(app).delete(`/admin/users/${staff.id}`).set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.message).toBe('SUCCESSFULLY DELETED!');
			expect(res.body.success).toBe(true);
			expect(res.body.data.deleted).toBe(true);
			expect(res.body.data.userId).toBe(staff.id);

			const deleted = await prisma.user.findUnique({ where: { id: staff.id } });

			expect(deleted).toBeNull();
		});
	});

	describe('❌ ERROR CASES:', () => {
		it('401 without token (authRequired)', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_update_name@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const res = await request(app).delete(`/admin/users/${admin.id}`);
			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it('403 when STAFF tries to call admin-only route (allowRoles)', async () => {
			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_update_name@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const token = signJwt({ id: staff.id, role: staff.role });

			const res = await request(app).delete(`/admin/users/${staff.id}`).set('Authorization', `Bearer ${token}`);

			expect(res.body.message).toBe('Forbidden');
			expect(res.statusCode).toBe(403);
			expect(res.body.field).toBe('auth');
			expect(res.body.code).toBe('ROLE_FORBIDDEN');
			expect(res.body.success).toBe(false);
		});

		it('400 when ID is not a valid UUID', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const invalidId = '1233';

			const res = await request(app).delete(`/admin/users/${invalidId}`).set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('Invalid user staff id format');
			expect(res.body.code).toBe('INVALID_ID_STAFF_FORMAT');
		});

		it('404 when target user does not exist', async () => {
			// Create a valid UUID-like string (not present in DB)
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

			const res = await request(app).delete(`/admin/users/${fakeUuid}`).set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('USER NOT FOUND!');
			expect(res.body.code).toBe('ERR_USER_NOT_FOUND');
		});

		it('403 when ADMIN tries to delete itself via /users/:id', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const res = await request(app).delete(`/admin/users/${admin.id}`).set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('ADMIN CANNOT DELETE ITSELF!');
			expect(res.body.code).toBe('ERR_ADMIN_SELF_DELETE');
		});

		//DEFENSIVE:
		it('403 when trying to delete an ADMIN user (target is ADMIN)', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});
			const token = signJwt({ id: admin.id, role: admin.role });

			const anotherAdmin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'adminanother@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const res = await request(app).delete(`/admin/users/${anotherAdmin.id}`).set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('CANNOT DELETE AN ADMIN USER!');
			expect(res.body.code).toBe('ERR_DELETE_ADMIN_BLOCKED');
		});

		it('500 when an internal error occurs during deletion', async () => {
			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_update_name@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			// Force prisma.user.delete to throw
			jest.spyOn(prisma.user, 'delete').mockImplementation(() => {
				throw new Error('DB Delete Error');
			});

			const res = await request(app).delete(`/admin/users/${staff.id}`).set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('UNEXPECTED ERROR IN ADMIN DELETE FUNCTION!');
			expect(res.body.code).toBe('ERR_ADMIN_DELETE_FAILED');
		});
	});
});
