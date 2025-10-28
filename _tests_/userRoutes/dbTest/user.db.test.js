// _tests_/user.db.test.js
//Test only DB, without Express
import { prisma } from '../../../src/users/db/prisma';

beforeAll(async () => {
	await prisma.$connect();
});

//IMPORTANT:
afterAll(async () => {
	await prisma.$disconnect();
});
beforeEach(async () => {
	await prisma.user.deleteMany();
});

describe('DB Tests', () => {
	describe('User CRUD', () => {
		test('C - Create user', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'John Doe',
					email: 'john@example.com',
					passwordHash: 'hash123',
					age: 25,
				},
			});
			expect(user).toHaveProperty('id');
			expect(user.email).toBe('john@example.com');
		});

		test('R - Read user', async () => {
			await prisma.user.create({
				data: {
					name: 'Jane',
					email: 'jane@example.com',
					passwordHash: 'hashJane',
					age: 30,
				},
			});
			const found = await prisma.user.findUnique({ where: { email: 'jane@example.com' } });
			expect(found).not.toBeNull();
			expect(found.name).toBe('Jane');
		});

		test('U - Update user', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Old Name',
					email: 'old@example.com',
					passwordHash: 'hashOld',
					age: 28,
				},
			});
			const updated = await prisma.user.update({
				where: { id: user.id },
				data: { name: 'New Name' },
			});
			expect(updated.name).toBe('New Name');
		});

		test('D - Delete user', async () => {
			const user = await prisma.user.create({
				data: {
					name: 'Delete Me',
					email: 'delete@example.com',
					passwordHash: 'hashDel',
					age: 27,
				},
			});
			await prisma.user.delete({ where: { id: user.id } });
			const gone = await prisma.user.findUnique({ where: { id: user.id } });
			expect(gone).toBeNull();
		});
	});

	describe('Native DB errors', () => {
		test('Constraint - unique email [P2002]', async () => {
			await prisma.user.create({
				data: {
					name: 'First',
					email: 'unique@example.com',
					passwordHash: 'hashFirst',
					age: 26,
				},
			});

			await expect(
				prisma.user.create({
					data: {
						name: 'Second',
						email: 'unique@example.com',
						passwordHash: 'hashSecond',
						age: 31,
					},
				}),
			).rejects.toMatchObject({ code: 'P2002' });
		});

		test('Update non-existent user [P2025]', async () => {
			await expect(
				prisma.user.update({
					where: { email: 'ghost@example.com' }, // precisa ser @unique no schema
					data: { name: 'Ghost' },
				}),
			).rejects.toHaveProperty('code', 'P2025');
		});
	});
});
