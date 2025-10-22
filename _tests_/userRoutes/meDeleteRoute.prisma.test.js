import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import bcrypt from "bcrypt";

import { prisma } from "../../src/users/db/prisma.js"

// ROUTES
import { router as meDeleteRouter } from "../../src/users/meDeleteRoute.js"

// MIDDLEWARES
import successHandler from "../../middlewares/successHandler.js";
import errorHandler from "../../middlewares/errorHandler.js";

// JWT
import { signJwt } from "../../src/auth/tokens/signJwt.js";

const app = express();
app.use(express.json());
app.use(successHandler);

// Mount only the route under test
app.use("/", meDeleteRouter);

app.use(errorHandler);

// Helpers
async function createUser({ name, age = 25, email, password, role = "STAFF" }) {
	const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
	const passwordHash = await bcrypt.hash(password, rounds);
	return prisma.user.create({
		data: { name, age, email, passwordHash, role },
	});
}

function bearer(token) {
	return { Authorization: `Bearer ${token}` };
}

describe("User Routes — DELETE /users/me", () => {
	let adminUser, staffUser;
	let adminToken, staffToken;

	beforeAll(async () => {
		await prisma.$connect();
	});

	beforeEach(async () => {
		await prisma.user.deleteMany();

		// Seed: 1 ADMIN + 1 STAFF
		adminUser = await createUser({
			name: "Root Admin",
			age: 35,
			email: process.env.ADMIN_SEED_EMAIL || "admin@mission5.local",
			password: process.env.ADMIN_SEED_PASSWORD || "Admin123!m5",
			role: "ADMIN",
		});

		staffUser = await createUser({
			name: "Staff Self",
			age: 23,
			email: "staff.self@ex.com",
			password: "Valid@123",
			role: "STAFF",
		});

		// Tokens
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

	describe("✅ SUCCESS CASES:", () => {
		it("✅ STAFF can self-delete (200, removes from DB)", async () => {
			const before = await prisma.user.count();
			expect(before).toBe(2);

			const res = await request(app)
				.delete("/users/me")
				.set(bearer(staffToken));

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("SUCCESSFULLY SELF-DELETED!");

			const after = await prisma.user.count();
			expect(after).toBe(1);

			const stillAdmin = await prisma.user.findUnique({ where: { id: adminUser.id } });
			expect(stillAdmin).not.toBeNull();
		});
	});

	describe("❌ ERROR CASES:", () => {
		it("❌ 401 without token (authRequired)", async () => {
			const res = await request(app).delete("/users/me");
			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
		});

		it("❌ 403 ADMIN cannot self-delete", async () => {
			const res = await request(app)
				.delete("/users/me")
				.set(bearer(adminToken));

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("ADMIN CANNOT DELETE ITSELF!");
			expect(res.body.code).toBe("ERR_ADMIN_SELF_DELETE");
		});

		it("❌ 404 when token user does not exist anymore", async () => {
			// Delete the staff before calling the route (simulate stale token)
			await prisma.user.delete({ where: { id: staffUser.id } });

			const res = await request(app)
				.delete("/users/me")
				.set(bearer(staffToken));

			expect(res.statusCode).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("USER NOT FOUND!");
			expect(res.body.code).toBe("ERR_USER_NOT_FOUND");
		});

		it("❌ 500 when an internal error occurs during delete", async () => {
			// Mock prisma.user.delete to throw
			jest.spyOn(prisma.user, "delete").mockImplementation(() => {
				throw new Error("DB Delete Error");
			});

			const res = await request(app)
				.delete("/users/me")
				.set(bearer(staffToken));

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("UNEXPECTED ERROR IN DELETE SELF FUNCTION!");
			expect(res.body.code).toBe("ERR_DELETE_ME_FAILED");
		});
	});
});
