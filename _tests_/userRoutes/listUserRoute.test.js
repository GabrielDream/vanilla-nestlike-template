import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { prisma } from '../../src/users/db/prisma.js';

// ROUTES
import { router as listUsersRouter } from '../../src/users/listUsersRoute.js';

// MIDDLEWARES
import successHandler from '../../middlewares/successHandler.js';
import errorHandler from '../../middlewares/errorHandler.js';

// JWT
import { signJwt } from '../../src/auth/tokens/signJwt.js';

const app = express();
app.use(express.json());
app.use(successHandler);

// Mount only the route under test
app.use('/', listUsersRouter);

app.use(errorHandler);

beforeAll(async () => {
	await prisma.$connect();
});

afterEach(async () => {
	await prisma.user.deleteMany()
	jest.restoreAllMocks()
});

afterAll(async () => {
	await prisma.$disconnect();
});

/*
const createTestUser = async (userData) => {
	const user = await prisma.user.create({
		data: {
			name: userData.name,
			email: userData.email,
			passwordHash: 'hash',
			role: userData.role,
			age: userData.age || 25,
		},
	});
	return { user, token: signJwt({ id: user.id, role: user.role }) };
};
*/
describe('User Routes — GET /users', () => {
	describe('✅ SUCCESS CASES:', () => {
		it('✅ ADMIN should see full fields (id,name,email,age,role,createdAt)', async () => {
			// Cria 1 ADMIN (logado) + 1 STAFF (apenas para compor a lista)
			const adminUser = await prisma.user.create({
				data: {
					name: 'Admin User',
					email: 'admin@test.com',
					passwordHash: 'hash',
					role: 'ADMIN',
					age: 35,
				},
			});

			await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff@test.com',
					passwordHash: 'hash',
					role: 'STAFF',
					age: 25,
				},
			});

			const token = signJwt({ id: adminUser.id, role: adminUser.role });

			const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe('LISTUSERS FUNCTION: SUCCESSFULLY SHOWN!');
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(2); // admin + staff

			for (const user of res.body.data) {
				expect(user).toHaveProperty('id');
				expect(user).toHaveProperty('name');
				expect(user).toHaveProperty('email');
				expect(user).toHaveProperty('age');
				expect(user).toHaveProperty('role');
				expect(user).toHaveProperty('createdAt');

				expect(user).not.toHaveProperty('password');
				expect(user).not.toHaveProperty('passwordHash');
			}
		});

		it('✅ STAFF should see limited fields (id,name,email) — no age/role/createdAt', async () => {
			// Cria 1 ADMIN (apenas para compor a lista)
			await prisma.user.create({
				data: {
					name: 'Admin User',
					email: 'admin@test.com',
					passwordHash: 'hash',
					role: 'ADMIN',
					age: 35,
				},
			});

			// Cria o STAFF logado
			const staffUser = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff@test.com',
					passwordHash: 'hash',
					role: 'STAFF',
					age: 25,
				},
			});

			const token = signJwt({ id: staffUser.id, role: staffUser.role });

			const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe('LISTUSERS FUNCTION: SUCCESSFULLY SHOWN!');
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(2); // admin + staff

			for (const user of res.body.data) {
				expect(user).toHaveProperty('id');
				expect(user).toHaveProperty('name');
				expect(user).toHaveProperty('email');

				expect(user).not.toHaveProperty('age');
				expect(user).not.toHaveProperty('role');
				expect(user).not.toHaveProperty('createdAt');
				expect(user).not.toHaveProperty('password');
				expect(user).not.toHaveProperty('passwordHash');
			}
		});

		it('✅ Should return 200 and empty array when no users exist', async () => {
			// afterEach já limpou a tabela

			// A rota só precisa de um payload com role ADMIN, não de um user real
			const token = signJwt({ id: 'ghost-id', role: 'ADMIN' });

			const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe('LISTUSERS FUNCTION: NO USERS TO SHOW');
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(0);
		});
	});

	describe('❌ ERROR CASES:', () => {
		it('❌ Should return 401 without token', async () => {
			const res = await request(app).get('/users');

			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it('❌ Should return 500 on database error', async () => {
			const token = signJwt({ id: 'admin-id', role: 'ADMIN' });

			jest.spyOn(prisma.user, 'findMany').mockRejectedValue(new Error('DB Error'));

			const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('UNEXPECTED ERROR IN LIST USERS FUNCTION!');
			expect(res.body.code).toBe('ERR_LISTUSERS_FAILED');
		});

		it('❌ Should return 403 for invalid role', async () => {
			const badToken = signJwt({ id: 'some-id', role: 'GODMODE' });

			const res = await request(app).get('/users').set('Authorization', `Bearer ${badToken}`);

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('INVALID ROLE DETECTED!');
			expect(res.body.code).toBe('ERR_INVALID_ROLE');
		});
	});
});

