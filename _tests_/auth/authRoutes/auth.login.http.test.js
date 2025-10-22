import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import bcrypt from "bcrypt";

import { prisma } from "../../../src/users/db/prisma.js";

// ⚠️ Se no loginRoute.js você exportou como named { router }, use esta importação:
import { router as loginRouter } from "../../../src/auth/routes/loginRoute.js";
// ⚠️ Se tiver export default, troque a linha acima por:
// import loginRouter from "../../../src/auth/routes/loginRoute.js";

import successHandler from "../../../middlewares/successHandler.js";
import errorHandler from "../../../middlewares/errorHandler.js";

const app = express();
app.use(express.json());
app.use(successHandler);
app.use("/auth", loginRouter);
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

describe("POST /auth/login", () => {
	describe("✅ SUCCESS CASES", () => {
		it("✅ should login with valid credentials and return JWT + user", async () => {
			const email = "test@example.com";
			const password = "Valid@123";
			const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
			const passwordHash = await bcrypt.hash(password, rounds);

			await prisma.user.create({
				data: {
					name: "Tester",
					age: 25,
					email,
					passwordHash,
					role: "STAFF",
				},
			});

			const res = await request(app).post("/auth/login").send({ email, password });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.message).toBe("LOGIN SUCCESSFUL!");
			expect(res.body.data).toHaveProperty("token");
			expect(res.body.data).toHaveProperty("user");
			expect(res.body.data.user.email).toBe(email);
			expect(res.body.data.user).toHaveProperty("role", "STAFF");
		});

		it("✅ should normalize email (trim + lowercase)", async () => {
			const email = "exist@example.com";
			const password = "Valid@123";
			const passwordHash = await bcrypt.hash(password, 12);

			await prisma.user.create({
				data: { name: "Existing", age: 30, email, passwordHash, role: "STAFF" },
			});

			const res = await request(app)
				.post("/auth/login")
				.send({ email: "   EXIST@EXAMPLE.COM   ", password });

			expect(res.statusCode).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.data.user.email).toBe(email);
		});
	});

	describe("❌ ERROR CASES", () => {
		it("❌ should return 400 if required fields are missing", async () => {
			const res = await request(app).post("/auth/login").send({ email: "", password: "" });

			expect(res.statusCode).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("EMAIL AND PASSWORD ARE REQUIRED!");
			expect(res.body.code).toBe("ERR_MISSING_FIELDS");
		});

		it("❌ should return 400 if email has invalid format", async () => {
			const res = await request(app).post("/auth/login").send({ email: "invalidEmail", password: "Valid@123" });

			expect(res.statusCode).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("INVALID EMAIL FORMAT!");
			expect(res.body.code).toBe("ERR_INVALID_EMAIL");
		});

		it("❌ should return 401 if user is not found", async () => {
			const res = await request(app).post("/auth/login").send({ email: "ghost@example.com", password: "Some@123" });

			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("INVALID CREDENTIALS!");
			expect(res.body.code).toBe("ERR_INVALID_CREDENTIALS");
		});

		it("❌ should return 401 if password is wrong", async () => {
			const email = "user@example.com";
			const rightPassword = "Right@123";
			const hash = await bcrypt.hash(rightPassword, 12);

			await prisma.user.create({
				data: { name: "User", age: 22, email, passwordHash: hash, role: "STAFF" },
			});

			const res = await request(app).post("/auth/login").send({ email, password: "Wrong@123" });

			expect(res.statusCode).toBe(401);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("INVALID CREDENTIALS!");
			expect(res.body.code).toBe("ERR_INVALID_CREDENTIALS");
		});

		it("❌ should return 500 on unexpected DB error (mapped)", async () => {
			const spy = jest
				.spyOn(prisma.user, "findUnique")
				.mockRejectedValueOnce(new Error("DB exploded"));

			const res = await request(app).post("/auth/login").send({ email: "x@x.com", password: "Valid@123" });

			expect(res.statusCode).toBe(500);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("UNEXPECTED ERROR IN LOGIN FUNCTION!");
			expect(res.body.code).toBe("ERR_LOGIN_FAILED");

			spy.mockRestore();
		});
	});
});
