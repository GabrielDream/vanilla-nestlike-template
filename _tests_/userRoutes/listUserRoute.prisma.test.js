import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import bcrypt from "bcrypt";

import { prisma } from "../../src/users/db/prisma.js"

// ROUTES
import { router as listUsersRouter } from "../../src/users/listUsersRoute.js"

// MIDDLEWARES
import successHandler from "../../middlewares/successHandler.js";
import errorHandler from "../../middlewares/errorHandler.js";

// JWT
import { signJwt } from "../../src/auth/tokens/signJwt.js";

const app = express();
app.use(express.json());
app.use(successHandler);

// Mount only the route under test
app.use("/", listUsersRouter);

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

describe("User Routes — GET /users", () => {
	let adminUser, staffUser1, staffUser2;
	let adminToken, staffToken;

	beforeAll(async () => {
		await prisma.$connect();
	});

	beforeEach(async () => {
		await prisma.user.deleteMany();

		// seed basic users: 1 ADMIN + 2 STAFF
		adminUser = await createUser({
			name: "Root Admin",
			age: 35,
			email: process.env.ADMIN_SEED_EMAIL || "admin@mission5.local",
			password: process.env.ADMIN_SEED_PASSWORD || "Admin123!m5",
			role: "ADMIN",
		});

		staffUser1 = await createUser({
			name: "Staff One",
			age: 22,
			email: "staff1@ex.com",
			password: "Valid@123",
			role: "STAFF",
		});

		staffUser2 = await createUser({
			name: "Staff Two",
			age: 28,
			email: "staff2@ex.com",
			password: "Valid@123",
			role: "STAFF",
		});

		// Generate JWT tokens directly using signJwt (authRequired will validate them)
		adminToken = signJwt({ id: adminUser.id, role: adminUser.role, email: adminUser.email });
		staffToken = signJwt({ id: staffUser1.id, role: staffUser1.role, email: staffUser1.email });
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		await prisma.user.deleteMany();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe("✅ SUCCESS CASES:", () => {
		it("✅ ADMIN should see full fields (id,name,email,age,role,createdAt)", async () => {
			const res = await request(app)
				.get("/users")
				.set(bearer(adminToken));

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("LISTUSERS FUNCTION: SUCCESSFULLY SHOWN!");
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBeGreaterThanOrEqual(1);

			// Validate expected fields for ADMIN
			for (const u of res.body.data) {
				expect(u).toHaveProperty("id");
				expect(u).toHaveProperty("name");
				expect(u).toHaveProperty("email");
				expect(u).toHaveProperty("age");
				expect(u).toHaveProperty("role");
				expect(u).toHaveProperty("createdAt");
				// Ensure sensitive fields are not exposed
				expect(u).not.toHaveProperty("password");
				expect(u).not.toHaveProperty("passwordHash");
			}
		});

		it("✅ STAFF should see limited fields (id,name,email) — no age/role/createdAt", async () => {
			const res = await request(app)
				.get("/users")
				.set(bearer(staffToken));

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("LISTUSERS FUNCTION: SUCCESSFULLY SHOWN!");
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBeGreaterThanOrEqual(1);

			// Validate expected fields for STAFF
			for (const u of res.body.data) {
				expect(u).toHaveProperty("id");
				expect(u).toHaveProperty("name");
				expect(u).toHaveProperty("email");

				expect(u).not.toHaveProperty("age");
				expect(u).not.toHaveProperty("role");
				expect(u).not.toHaveProperty("createdAt");
				expect(u).not.toHaveProperty("password");
				expect(u).not.toHaveProperty("passwordHash");
			}
		});

		it("✅ Should return 200 and an empty list when no users exist", async () => {
			// Keep a valid token (ADMIN), but clear the table before GET
			await prisma.user.deleteMany();

			const token = signJwt({ id: "ghost", role: "ADMIN", email: "ghost@local" });
			const res = await request(app)
				.get("/users")
				.set(bearer(token));

			// The route does not depend on the existence of the user in DB to list
			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("LISTUSERS FUNCTION: NO USERS TO SHOW");
			expect(Array.isArray(res.body.data)).toBe(true);
			expect(res.body.data.length).toBe(0);
		});
	});

	describe("❌ ERROR CASES:", () => {
		it("❌ Should return 401 without token (authRequired)", async () => {
			const res = await request(app).get("/users");
			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
			// Exact error message depends on your authRequired implementation
		});

		it("❌ Should return 500 if an internal error occurs while fetching users", async () => {
			jest.spyOn(prisma.user, "findMany").mockImplementation(() => {
				throw new Error("DB Error");
			});

			const res = await request(app)
				.get("/users")
				.set(bearer(adminToken));

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("UNEXPECTED ERROR IN LIST USERS FUNCTION!");
			expect(res.body.code).toBe("ERR_LISTUSERS_FAILED");
		});

		it("❌ Should return 403 if an invalid role is detected", async () => {
			const weird = await createUser({
				name: "Weird Role",
				age: 40,
				email: "weird@ex.com",
				password: "Valid@123",
				role: "STAFF", // created normally
			});

			// Forge a token with an invalid role (simulating payload corruption)
			const badToken = signJwt({ id: weird.id, role: "GODMODE", email: weird.email });

			const res = await request(app)
				.get("/users")
				.set(bearer(badToken));

			expect(res.statusCode).toBe(403);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("INVALID ROLE DETECTED!");
			expect(res.body.code).toBe("ERR_INVALID_ROLE");
		});
	});
});
