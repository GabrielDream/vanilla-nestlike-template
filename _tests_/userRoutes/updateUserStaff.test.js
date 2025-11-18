import { describe, expect, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';

import { prisma } from '../../src/users/db/prisma.js';
import { router } from '../../src/users/staffRoutes/updateUserStaff.js';

import successHandler from '../../middlewares/successHandler.js';
import errorHandler from '../../middlewares/errorHandler.js';
import { signJwt } from '../../src/auth/tokens/signJwt.js';

const app = express();
app.use(express.json());

app.use(successHandler);
app.use('/', router);
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

describe('PUT /users/:id - Staff Self Update', () => {
	describe('✅ Success Cases: ', () => {
		it('should update name successfully', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staff@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25,
				},

			});

			const token = signJwt({ id: user.id, role: user.role });

			const res = await request(app).put(`/users/${user.id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Staff Updated' });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.data.user.name).toBe('Staff Updated');
		});

		it('should update email successfully', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staffTOUPDATE@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25,
				},
			});
			const token = signJwt({ id: user.id, role: user.role });

			const res = await request(app).put(`/users/${user.id}`).set('Authorization', `Bearer ${token}`).send({ email: 'newstaffemailupdated@test.com' });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.data.user.email).toBe('newstaffemailupdated@test.com');
		});

		it('should update age successfully', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staffage@test.com',
					passwordHash: await bcrypt.hash('Test@123', 10),
					role: 'STAFF',
					age: 25,
				},
			});

			const token = signJwt({ id: user.id, role: user.role });

			const res = await request(app).put(`/users/${user.id}`).set('Authorization', `Bearer ${token}`).send({ age: 35 });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);
			expect(res.body.data.user.age).toBe(35);
		});

		it('should update password successfully', async () => {
			const oldPassword = 'Test@123';
			const newPassword = 'NewPass@123';

			const user = await prisma.user.create({
				data: {
					name: 'Staff User',
					email: 'staffpass@test.com',
					passwordHash: await bcrypt.hash(oldPassword, 10),
					role: 'STAFF',
					age: 25,
				},
			});

			const token = signJwt({ id: user.id, role: user.role });

			const res = await request(app).put(`/users/${user.id}`).set('Authorization', `Bearer ${token}`).send({ password: newPassword });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.updated).toBe(true);

			// Verifica no banco se o hash foi realmente atualizado
			const updatedUser = await prisma.user.findUnique({
				where: { id: user.id },
				select: { passwordHash: true },
			});

			const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.passwordHash);

			expect(isNewPasswordValid).toBe(true);
		});
	});
	describe('❌ Error Cases', () => {
		describe('CORE:', () => {
			it('should fail when is an invalid id', async () => {
				const userWithInvalidId = await prisma.user.create({
					data: {
						id: 'invalidID',
						name: 'Staff User',
						email: 'staffage@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25,
					},
				});
				const token = signJwt({ id: userWithInvalidId.id, role: userWithInvalidId.role });

				const res = await request(app).put(`/users/${userWithInvalidId.id}`).set('Authorization', `Bearer ${token}`);

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('Invalid user id format');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('INVALID_ID_FORMAT');
			});

			it('should fail when extra fields are sent', async () => {
				const user = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25,
					},
				});
				const token = signJwt({ id: user.id, role: user.role });

				const res = await request(app).put(`/users/${user.id}`).set('Authorization', `Bearer ${token}`).send({
					name: 'Updated Name',
					role: 'ADMIN', // ⚠️ CAMPO EXTRA NÃO PERMITIDO
					extraField: 'hack' // ⚠️ OUTRO CAMPO EXTRA
				});

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toContain('EXTRA FIELDS ARE NOT ALLOWED');
				expect(res.body.code).toBe('ERR_EXTRA_FIELDS');
			});

			it('should fail when theres no change', async () => {
				const user = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staffage@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25,
					},
				});
				const token = signJwt({ id: user.id, role: user.role });

				const res = await request(app).put(`/users/${user.id}`).set('Authorization', `Bearer ${token}`);

				expect(res.statusCode).toBe(400);
				expect(res.body.message).toBe('At least one field must be provided');
				expect(res.body.field).toBe('users');
				expect(res.body.code).toBe('NO_FIELDS_TO_UPDATE');
			});
		})

		describe('BODY VALIDATIONS', () => {
			describe('BODY VALIDATIONS', () => {
				it('should fail when email is invalid', async () => {
					const user = await prisma.user.create({
						data: {
							name: 'Staff User',
							email: 'staff_invalid_email@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 25,
						},
					});

					const token = signJwt({ id: user.id, role: user.role });

					const res = await request(app)
						.put(`/users/${user.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ email: 'invalid-email' }); // sem @ / domínio

					expect(res.statusCode).toBe(400);
					expect(res.body.message).toBe('Invalid email');
					expect(res.body.field).toBe('users');
					expect(res.body.code).toBe('INVALID_EMAIL');
				});

				it('should fail when age is invalid', async () => {
					const user = await prisma.user.create({
						data: {
							name: 'Staff User',
							email: 'staff_invalid_age@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 25,
						},
					});

					const token = signJwt({ id: user.id, role: user.role });

					const res = await request(app)
						.put(`/users/${user.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ age: 150 }); // fora do range 1–100

					expect(res.statusCode).toBe(400);
					expect(res.body.message).toBe('Invalid age');
					expect(res.body.field).toBe('users');
					expect(res.body.code).toBe('INVALID_AGE');
				});

				it('should fail when name contains numbers', async () => {
					const user = await prisma.user.create({
						data: {
							name: 'Staff User',
							email: 'staff_invalid_name@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 25,
						},
					});

					const token = signJwt({ id: user.id, role: user.role });

					const res = await request(app)
						.put(`/users/${user.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ name: 'John123' });

					expect(res.statusCode).toBe(400);
					expect(res.body.message).toBe('Invalid name');
					expect(res.body.field).toBe('users');
					expect(res.body.code).toBe('INVALID_NAME');
				});

				it('should fail when password is weak', async () => {
					const user = await prisma.user.create({
						data: {
							name: 'Staff User',
							email: 'staff_invalid_password@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 25,
						},
					});

					const token = signJwt({ id: user.id, role: user.role });

					const res = await request(app)
						.put(`/users/${user.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ password: 'weak' }); // sem maiúscula / especial / tamanho

					expect(res.statusCode).toBe(400);
					expect(res.body.message).toBe('Invalid password');
					expect(res.body.field).toBe('users');
					expect(res.body.code).toBe('INVALID_PASSWORD');
				});

				it('should fail when email is already in use', async () => {
					// usuário original
					const user = await prisma.user.create({
						data: {
							name: 'Staff User',
							email: 'staff_inuse@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 25,
						},
					});

					// outro user com o email que será "duplicado"
					await prisma.user.create({
						data: {
							name: 'Other Staff',
							email: 'other_inuse@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 30,
						},
					});

					const token = signJwt({ id: user.id, role: user.role });

					// aqui a gente mocka o update pra simular P2002 do Prisma
					const updateSpy = jest
						.spyOn(prisma.user, 'update')
						.mockRejectedValueOnce({ code: 'P2002' });

					const res = await request(app)
						.put(`/users/${user.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ email: 'other_inuse@test.com' });

					expect(res.statusCode).toBe(400);
					expect(res.body.code).toBe('EMAIL_IN_USE');

					updateSpy.mockRestore();
				});

				it('should fail when there is no effective change', async () => {
					const user = await prisma.user.create({
						data: {
							name: 'Staff User',
							email: 'staff_nochange@test.com',
							passwordHash: await bcrypt.hash('Test@123', 10),
							role: 'STAFF',
							age: 25,
						},
					});

					const token = signJwt({ id: user.id, role: user.role });

					// envia exatamente os mesmos dados
					const res = await request(app)
						.put(`/users/${user.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ name: 'Staff User' });

					expect(res.statusCode).toBe(400);
					expect(res.body.message).toBe('Nothing to update');
					expect(res.body.field).toBe('users');
					expect(res.body.code).toBe('NO_CHANGES');
				});
			});
		})

		describe('GUARD VALIDATIONS', () => {
			it('should NOT allow STAFF to update another STAFF', async () => {
				const staff1 = await prisma.user.create({
					data: {
						name: 'Staff One',
						email: 'staff1@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25,
					},
				});

				const staff2 = await prisma.user.create({
					data: {
						name: 'Staff Two',
						email: 'staff2@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 30,
					},
				});

				const token = signJwt({ id: staff1.id, role: staff1.role });

				const res = await request(app).put(`/users/${staff2.id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Hacked Name' });

				expect(res.statusCode).toBe(403);
				expect(res.body.message).toBe('Forbidden');
				expect(res.body.field).toBe('auth');
				expect(res.body.code).toBe('SELF_OR_ROLE_FORBIDDEN');
				expect(res.body.success).toBe(false);
			});

			it('should NOT allow STAFF to update ADMIN', async () => {
				const admin = await prisma.user.create({
					data: {
						name: 'Admin User',
						email: 'admin@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'ADMIN',
						age: 40,
					},
				});

				const staff = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_guard@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25,
					},
				});

				const token = signJwt({ id: staff.id, role: staff.role });

				const res = await request(app).put(`/users/${admin.id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Hacked Admin' });

				expect(res.statusCode).toBe(403);
				expect(res.body.message).toBe('Forbidden');
				expect(res.body.field).toBe('auth');
				expect(res.body.code).toBe('SELF_OR_ROLE_FORBIDDEN');
				expect(res.body.success).toBe(false);
			});

			it('should block when no token is provided', async () => {
				const user = await prisma.user.create({
					data: {
						name: 'Staff User',
						email: 'staff_notoken@test.com',
						passwordHash: await bcrypt.hash('Test@123', 10),
						role: 'STAFF',
						age: 25,
					},
				});

				const res = await request(app).put(`/users/${user.id}`).send({ name: 'Should Not Work' });

				expect(res.statusCode).toBe(401);
				expect(res.body.message).toBe('Missing Authorization header');
				expect(res.body.field).toBe('authorization');
				expect(res.body.code).toBe('AUTH_MISSING');
				expect(res.body.success).toBe(false);
			});
		});

		// ✅ TESTE CORRIGIDO PARA UPDATE ROUTE
		it('should return 500 when an internal error occurs during update', async () => {
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

			// ✅ Mock CORRETO para update
			jest.spyOn(prisma.user, 'update').mockImplementation(() => {
				throw new Error('DB update Error');
			});

			// ✅ Envia algum campo válido para update
			const res = await request(app)
				.put(`/users/${user.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'Updated Name' }); // 🔥 PRECISA DE BODY!

			// ✅ Expectations CORRETAS para UPDATE
			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe('Update failed'); // ✅ Mensagem da UPDATE route
			expect(res.body.code).toBe('UPDATE_FAILED'); // ✅ Código da UPDATE route
		});
	})
});
