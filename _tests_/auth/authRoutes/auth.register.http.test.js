import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { prisma } from '../../../src/users/db/prisma.js';

import { router } from '../../../src/auth/routes/registerRoute.js';
import successHandler from '../../../middlewares/successHandler.js';
import errorHandler from '../../../middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use(successHandler);
app.use('/auth', router);
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

describe('User Routes', () => {
	describe('POST /auth/register', () => {
		describe('✅SUCCESS CASES: ', () => {
			it('✅ should create a user with valid data', async () => {
				const res = await request(app).post('/auth/register').send({
					name: 'Test User',
					age: 25,
					email: 'test@example.com',
					password: 'Valiadsfadfd@123!',
				});

				expect(res.statusCode).toBe(201);
				expect(res.body.success).toBe(true);
				expect(res.body.message).toBe('SUCCESSFULLY REGISTERED!');
			});

			it("✅ Should accept age as a numeric string like '25'", async () => {
				const res = await request(app).post('/auth/register').send({
					name: 'Valid Name',
					age: '25', // ← string numérica válida
					email: 'only@anexemple.com',
					password: 'Valid@123',
				});

				expect(res.statusCode).toBe(201);
				expect(res.body.success).toBe(true);
				expect(res.body.message).toBe('SUCCESSFULLY REGISTERED!');
			});
		});

		describe('❌ ERROR CASES: ', () => {
			it('❌ Should return 400 if required fields are missing', async () => {
				const res = await request(app).post('/auth/register').send({
					name: '',
					age: '',
					email: '',
					password: '',
				});

				expect(res.statusCode).toBe(400);
				expect(res.body.success).toBe(false);
				expect(res.body.message).toBe('ALL FIELDS NEED TO BE FILLED!');
			});

			it('❌ should return 400 if password is weak', async () => {
				const res = await request(app).post('/auth/register').send({
					name: 'name',
					age: 3,
					email: 'valid@email.com',
					password: '123', // senha inválida
				});

				expect(res.statusCode).toBe(400);
				expect(res.body.success).toBe(false);
				expect(res.body.message).toMatch(/PASSWORD TOO SHORT/i);
			});

			it('❌ should return 400 if extra parameters are sent', async () => {
				const res = await request(app).post('/auth/register').send({
					name: 'User Extra',
					age: 30,
					email: 'extra@example.com',
					password: 'Valid@123',
					extraParam: 'notAllowed',
				});

				expect(res.statusCode).toBe(400);
				expect(res.body.success).toBe(false);
				expect(res.body.code).toBe('ERR_EXTRA_FIELDS');
				expect(res.body.message).toMatch('EXTRA FIELDS ARE NOT ALLOWED: extraParam');
			});

			it('❌ should handle internal server erros', async () => {
				jest.spyOn(prisma.user, 'create').mockImplementation(() => {
					throw new Error('DB error');
				});

				const res = await request(app).post('/auth/register').send({
					name: 'Test User',
					age: 25,
					email: 'test4@example.com',
					password: 'Valid@123',
				});

				expect(res.statusCode).toBe(500);
				expect(res.body.success).toBe(false);
				expect(res.body.message).toBe('UNEXPECTED ERROR IN REGISTER FUNCTION!');
			});

			describe('NAME FIELD:', () => {
				it('❌ should return 400 if name is not a String', async () => {
					const res = await request(app).post('/auth/register').send({
						name: 2,
						age: 30,
						email: 'only@anexemple.com',
						password: 'Valid@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe('ADD FUNCTION: INVALID NAME!');
				});

				it('❌ should return 400 if name is a number', async () => {
					const res = await request(app).post('/auth/register').send({
						name: 5,
						age: 3,
						email: 'valid@email.com',
						password: 'Password@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe('ADD FUNCTION: INVALID NAME!');
				});
			});

			describe('AGE FIELD:', () => {
				it('❌ Should return 400 if age is not a valid number', async () => {
					const res = await request(app).post('/auth/register').send({
						name: 'Invalid name',
						age: 'abc', // Invalid data type for age
						email: 'only@anexemple.com',
						password: 'Valid@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe('ADD FUNCTION: INVALID AGE!');
					expect(res.body.code).toBe('ERR_INVALID_AGE');
				});

				it('❌ Should return 400 if age is less than 1', async () => {
					const res = await request(app).post('/auth/register').send({
						name: 'Too Young',
						age: -5, // Invalid age
						email: 'young@example.com',
						password: 'Valid@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe('ADD FUNCTION: INVALID AGE!');
					expect(res.body.code).toBe('ERR_INVALID_AGE');
				});

				it('❌ Should return 400 if age is higher than 100', async () => {
					const res = await request(app).post('/auth/register').send({
						name: 'Too Young',
						age: 300, // Invalid age
						email: 'young@example.com',
						password: 'Valid@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe('ADD FUNCTION: INVALID AGE!');
					expect(res.body.code).toBe('ERR_INVALID_AGE');
				});
			});

			describe('EMAIL FIELD:', () => {
				it('❌ should return 400 if email is in use', async () => {
					await prisma.user.create({
						data: {
							name: 'Invalid name',
							age: 3,
							email: 'only@anexemple.com',
							passwordHash: 'hash',
							role: 'STAFF',
						},
					});

					const res = await request(app).post('/auth/register').send({
						name: 'Invalid name',
						age: 3,
						email: 'only@anexemple.com',
						password: 'Valid@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toBe('EMAIL ALREADY IN USE!');
				});

				it('❌ should return 400 if email has invalid format', async () => {
					const res = await request(app).post('/auth/register').send({
						name: 'name',
						age: 3,
						email: 'invalidEmailcom',
						password: 'Valid@123',
					});

					expect(res.statusCode).toBe(400);
					expect(res.body.success).toBe(false);
					expect(res.body.message).toMatch(/INVALID EMAIL FORMAT!/i);
				});
			});
		});
	});
});
