import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// ⬇️ usa tua rota de checkEmail (a versão Prisma/ESM que importa o singleton)
import userRoutes from "../../src/users/emailCheckRoute.js";

// ⬇️ singleton do Prisma (aquele src/db/prisma.js que fizemos)
import prisma from "../../src/users/db/prisma.js"

// ⬇️ teus middlewares (mantidos)
import successHandler from "../../middlewares/successHandler.js";
import errorHandler from "../../middlewares/errorHandler.js";

// Express server just for test:
const app = express();
app.use(express.json());
app.use(successHandler);
app.use("/api", userRoutes);
app.use(errorHandler);

describe("User Route to check Email (Prisma/Postgres)", () => {
	beforeAll(async () => {
		// open Prisma connection
		await prisma.$connect();
	});

	afterEach(async () => {
		// clean table between tests
		await prisma.user.deleteMany();
		// keep same behavior you had
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		// close Prisma connection
		await prisma.$disconnect();
	});

	describe("GET /api/checkEmail/:email", () => {
		describe("✅SUCCESS CASES: ", () => {
			it("✅ Should return false if email is not found", async () => {
				const res = await request(app).get("/api/checkEmail/exist@example.com");
				expect(res.statusCode).toBe(200);
				expect(res.body.success).toBe(true);
				expect(res.body.data.exists).toBe(false); // Email not found
			});

			it("✅ Should return true if email exists", async () => {
				// seed user in Postgres via Prisma
				await prisma.user.create({
					data: {
						name: "Existing User",
						email: "exist@example.com",
						passwordHash: "Test@1234",
					},
				});

				const res = await request(app).get("/api/checkEmail/exist@example.com");
				expect(res.statusCode).toBe(200);
				expect(res.body.success).toBe(true);
				expect(res.body.data.exists).toBe(true); // Email exists
				// console.log(res.body); // Debugging (opcional)
			});

			it("✅ Normalizes spaces/uppercase", async () => {
				await prisma.user.create({
					data: {
						name: "John",
						email: "john@example.com",
						passwordHash: "hash",
					},
				});

				const res = await request(app).get(
					"/api/checkEmail/   JOHN@EXAMPLE.COM   "
				);
				expect(res.statusCode).toBe(200);
				expect(res.body.success).toBe(true);
				expect(res.body.data.exists).toBe(true);
			});
		});

		describe("❌ ERROR CASES: ", () => {
			it("❌ should return 400 if email has invalid format", async () => {
				const res = await request(app).get("/api/checkEmail/notanemail");

				expect(res.statusCode).toBe(400);
				expect(res.body.success).toBe(false);
				expect(res.body.message).toBe("EMAIL IS INVALID!");
			});

			it("❌ should return 500 if db failures", async () => {
				// simula falha do Prisma, equivalente ao teu spy do Mongoose
				const spy = jest
					.spyOn(prisma.user, "findUnique")
					.mockRejectedValueOnce(new Error("Database failure"));

				const res = await request(app).get("/api/checkEmail/test@example.com");

				expect(res.statusCode).toBe(500);
				expect(res.body.success).toBe(false);
				expect(res.body.message).toBe("ERROR TO CHECK EMAIL!");

				spy.mockRestore();
			});
		});
	});
});
