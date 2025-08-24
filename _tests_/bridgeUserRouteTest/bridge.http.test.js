import request from "supertest";

import app, { prisma } from "./app.bridge.userToDb.js";

beforeAll(async () => {
	await prisma.$connect();
});

afterAll(async () => {
	await prisma.$disconnect();
});

beforeEach(async () => {
	await prisma.user.deleteMany();
});

describe("Bridge HTTP — success + DB error mapping", () => {
	test("Create a user and response by successHandler", async () => {
		const payload = { name: "Jane", email: "jane@example.com", passwordHash: "hashJane" };

		const res = await request(app).post('/users').send(payload);

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			success: true,
			status: 'Success',
			message: "USER CREATED",
		});
	});

	test("Duplicate email → mapped P2002", async () => {
		await request(app).post("/users").send({ name: "Jane", email: "jane@example.com", passwordHash: "hashJane" });

		const dup = await request(app).post("/users").send({ name: "Another", email: "jane@example.com", passwordHash: "x" });

		expect(dup.status).toBe(409);
		expect(dup.body).toMatchObject({
			success: false,
			status: "Error",
			message: "E-mail já cadastrado",
			code: "P2002_DUPLICATE",
			field: "email",
		});
	});
});
