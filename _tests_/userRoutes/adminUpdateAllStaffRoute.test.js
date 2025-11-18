// _tests_/users/adminUpdateStaffRoute.http.test.js

import { describe, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

import { prisma } from '../../src/users/db/prisma.js';
import { router as adminUpdateRouter } from '../../src/users/adminRoutes/adminUpdateAllStaffRoute.js';

import successHandler from '../../middlewares/successHandler.js';
import errorHandler from '../../middlewares/errorHandler.js';
import { signJwt } from '../../src/auth/tokens/signJwt.js';

const app = express();
app.use(express.json());

app.use(successHandler);
app.use('/', adminUpdateRouter);
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

describe('PUT /admin/users/:id - Admin Update Staff', () => {
	describe('✅ Success Cases', () => {
		it('should allow ADMIN to update STAFF name successfully', async () => {
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

			const res = await request(app)
				.put(`/admin/users/${staff.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'Staff Updated By Admin' });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.message).toBe('Staff updated successfully');
		});

		it('should allow ADMIN to update STAFF email successfully', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin_email@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_update_email@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const res = await request(app)
				.put(`/admin/users/${staff.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ email: 'new_staff_email@test.com' });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.data.user.email).toBe('new_staff_email@test.com');
			expect(res.body.message).toBe('Staff updated successfully');
		});

		it('should allow ADMIN to update STAFF age successfully', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin_age@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_update_age@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const res = await request(app)
				.put(`/admin/users/${staff.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ age: 35 });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.data.user.age).toBe(35);
			expect(res.body.message).toBe('Staff updated successfully');
		});

		it('should allow ADMIN to reset STAFF password successfully', async () => {
			const oldPassword = 'Test@123';
			const newPassword = 'NewPass@123';

			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin_pass@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_reset_password@test.com',
					passwordHash: await bcrypt.hash(oldPassword, 10),
					role: 'STAFF',
					age: 25
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			const res = await request(app)
				.put(`/admin/users/${staff.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ password: newPassword });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.message).toBe('Staff updated successfully');

			// Verifica no banco se o hash foi realmente atualizado
			const updatedUser = await prisma.user.findUnique({
				where: { id: staff.id },
				select: { passwordHash: true }
			});

			const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.passwordHash);
			expect(isNewPasswordValid).toBe(true);
		});
	});

	describe('❌ Error Cases', () => {
		describe('CORE', () => {
			it('should fail when user staff id format is invalid', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_invalid_id@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const invalidId = 'not-a-uuid';

				const res = await request(app)
					.put(`/admin/users/${invalidId}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ name: 'Should Not Work' });

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Invalid user staff id format');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('INVALID_ID_STAFF_FORMAT');
			});

			it('should return 404 when target staff user is not found', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_notfound@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				// UUID válido, mas não existe no banco
				const nonExistingId = '123e4567-e89b-12d3-a456-426614174000';

				const res = await request(app)
					.put(`/admin/users/${nonExistingId}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ name: 'Ghost Staff' });

				expect(res.statusCode).toBe(404);
				expect(res.body.message).toBe('User not found');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('ID_NOT_FOUND');
			});

			it('should fail when no fields are provided to update', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_nofields@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_nofields@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app).put(`/admin/users/${staff.id}`).set('Authorization', `Bearer ${token}`);

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('At least one field must be provided');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('NO_FIELDS_TO_UPDATE');
			});
		});

		describe('BODY VALIDATIONS', () => {
			it('should fail when email is invalid', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_invalid_body_email@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_invalid_email_admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app)
					.put(`/admin/users/${staff.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ email: 'invalid-email' });

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Invalid email');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('INVALID_EMAIL');
			});

			it('should fail when age is invalid', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_invalid_body_age@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_invalid_age_admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app)
					.put(`/admin/users/${staff.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ age: 150 });

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Invalid age');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('INVALID_AGE');
			});

			it('should fail when name contains numbers', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_invalid_body_name@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_invalid_name_admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app)
					.put(`/admin/users/${staff.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ name: 'John123' });

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Invalid name');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('INVALID_NAME');
			});

			it('should fail when password is weak', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_invalid_body_pass@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_invalid_pass_admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app)
					.put(`/admin/users/${staff.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ password: 'weak' });

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Invalid password');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('INVALID_PASSWORD');
			});

			it('should fail with EMAIL_IN_USE when Prisma returns P2002', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_p2002@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_p2002@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const updateSpy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce({ code: 'P2002' });

				const res = await request(app)
					.put(`/admin/users/${staff.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ email: 'duplicate@test.com' });

				expect(res.statusCode).toBe(400);
				expect(res.body.code).toBe('EMAIL_IN_USE');

				updateSpy.mockRestore();
			});

			it('should fail with NO_CHANGES when there is no effective change', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_nochange@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_nochange_admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app)
					.put(`/admin/users/${staff.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ name: 'Staff User' }); // mesmo nome

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Nothing to update');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('NO_CHANGES');
			});
		});

		describe('GUARD VALIDATIONS', () => {
			it('should NOT allow STAFF to access /admin/users/:id', async () => {
				//VTesting the integration of this route with middleware allowRoles.
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_guard@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_guard_try_admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const staffToken = signJwt({ id: staff.id, role: staff.role });

				const res = await request(app)
					.put(`/admin/users/${admin.id}`)
					.set('Authorization', `Bearer ${staffToken}`)
					.send({ name: 'Hacked Admin' });

				expect(res.statusCode).toBe(403);
				expect(res.body.message).toBe('Forbidden');
				expect(res.body.field).toBe('auth');
				expect(res.body.code).toBe('ROLE_FORBIDDEN');
				expect(res.body.success).toBe(false);
			});

			it('should NOT allow ADMIN to update itself', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Root Admin',
						email: 'admin_self_update@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const token = signJwt({ id: admin.id, role: admin.role });

				const res = await request(app)
					.put(`/admin/users/${admin.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ name: 'New Admin Name' });

				expect(res.statusCode).toBe(403);
				expect(res.body.message).toBe('Admin cannot update own profile');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('ADMIN_SELF_UPDATE_FORBIDDEN');
			});

			it('should NOT allow ADMIN to update another ADMIN', async () => {
				const admin1 = await prisma.user.create({
					data: {
						name: 'Admin One',
						email: 'admin_one@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 40
					}
				});

				const admin2 = await prisma.user.create({
					data: {
						name: 'Admin Two',
						email: 'admin_two@test.com',
						passwordHash: await bcrypt.hash('Admin@123', 10),
						role: 'ADMIN',
						age: 45
					}
				});

				const token = signJwt({ id: admin1.id, role: admin1.role });

				const res = await request(app)
					.put(`/admin/users/${admin2.id}`)
					.set('Authorization', `Bearer ${token}`)
					.send({ name: 'Hacked Admin Two' });

				expect(res.statusCode).toBe(403);
				expect(res.body.message).toBe('Cannot update another admin');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('UPDATE_ADMIN_FORBIDDEN');
			});

			it('should block when no token is provided', async () => {
				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_notoken_adminroute@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25
					}
				});

				const res = await request(app).put(`/admin/users/${staff.id}`).send({ name: 'Should Not Work' });

				expect(res.statusCode).toBe(401);
				expect(res.body.message).toBe('Missing Authorization header');
				expect(res.body.field).toBe('authorization');
				expect(res.body.code).toBe('AUTH_MISSING');
				expect(res.body.success).toBe(false);
			});
		});

		it('should return 500 when an internal error occurs during update', async () => {
			const admin = await prisma.user.create({
				data: {
					name: 'Root Admin',
					email: 'admin_internal_error@test.com',
					passwordHash: await bcrypt.hash('Admin@123', 10),
					role: 'ADMIN',
					age: 40
				}
			});

			const staff = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff_internal_error@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25
				}
			});

			const token = signJwt({ id: admin.id, role: admin.role });

			jest.spyOn(prisma.user, 'update').mockImplementation(() => {
				throw new Error('DB update Error');
			});

			const res = await request(app)
				.put(`/admin/users/${staff.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'Will Trigger Error' });

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('Update failed');
			expect(res.body.code).toBe('UPDATE_FAILED');
		});
	});
});
