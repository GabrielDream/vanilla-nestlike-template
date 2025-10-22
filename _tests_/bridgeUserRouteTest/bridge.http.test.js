import request from "supertest";
import app, { prisma } from "../bridgeUserRouteTest/app.bridge.userToDb";

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
		const payload = { name: "Jane", email: "jane@example.com", passwordHash: "hashJane", age: 22 };
		const res = await request(app).post("/users").send(payload);

		expect(res.status).toBe(200);
		// Se usa success(message, data): ajuste os expects conforme teu handler
		expect(res.body).toMatchObject({
			success: true,
			status: "Success",
			message: "USER CREATED",
		});
	});

	test("Duplicate email → mapped P2002", async () => {
		await request(app).post("/users").send({ name: "Jane", email: "jane@example.com", passwordHash: "hashJane", age: 22 });

		const dup = await request(app).post("/users").send({ name: "Another", email: "jane@example.com", passwordHash: "x", age: 24 });

		expect(dup.status).toBe(409);
		expect(dup.body).toMatchObject({
			success: false,
			status: "Error",
			message: "Email already registered",
			code: "P2002_DUPLICATE",
			field: "email",
		});
	});
});
