import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

import authRequired from "../../src/auth/guards/authRequired.js";
import { signJwt } from "../../src/auth/tokens/signJwt.js";
import { tokenDenylist } from "../../src/auth/tokens/tokenDenylist.memory.js";
import AppError from "../../middlewares/AppError.js";

describe("authRequired (integration smoke)", () => {
	beforeAll(() => {
		// Stable secret for tests
		process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
	});

	afterEach(async () => {
		await tokenDenylist._clear();
	});

	function makeApp() {
		const app = express();

		// Route protected by the guard
		app.get("/me", authRequired, (req, res) => {
			return res.status(200).json({ ok: true, user: req.user });
		});

		// Minimal error handler mapping AppError -> 4xx; unknown -> 500
		// Must be AFTER routes to catch thrown errors
		// eslint-disable-next-line no-unused-vars
		app.use((err, req, res, next) => {
			if (err instanceof AppError) {
				return res.status(err.statusCode).json({
					success: false,
					code: err.code,
					message: err.message,
				});
			}
			return res.status(500).json({
				success: false,
				code: "ERR_INTERNAL",
				message: "INTERNAL SERVER ERROR",
			});
		});

		return app;
	}

	test("200 on valid token (req.user attached)", async () => {
		const app = makeApp();
		const token = signJwt({ id: "u1", role: "user" }, "15m");

		const res = await request(app)
			.get("/me")
			.set("Authorization", `Bearer ${token}`)
			.send();

		expect(res.status).toBe(200);
		expect(res.body.ok).toBe(true);

		const dec = jwt.verify(token, process.env.JWT_SECRET);
		expect(res.body.user).toEqual(
			expect.objectContaining({ id: "u1", role: "user", jti: dec.jti })
		);
	});

	test("401 when Authorization header is missing", async () => {
		const app = makeApp();

		const res = await request(app).get("/me").send();

		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, code: "AUTH_MISSING" });
	});

	test("401 when token is denylisted (revoked)", async () => {
		const app = makeApp();
		const token = signJwt({ id: "u2", role: "user" }, "10m");

		const dec = jwt.verify(token, process.env.JWT_SECRET);
		const now = Math.floor(Date.now() / 1000);
		const ttlSec = Math.max(1, dec.exp - now);
		await tokenDenylist.revoke(dec.jti, ttlSec);

		const res = await request(app)
			.get("/me")
			.set("Authorization", `Bearer ${token}`)
			.send();

		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, code: "TOKEN_REVOKED" });
	});

	// ✅ Extra test you asked for
	test("401 when Authorization scheme is invalid (Basic)", async () => {
		const app = makeApp();

		const res = await request(app)
			.get("/me")
			.set("Authorization", "Basic abc123")
			.send();

		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, code: "AUTH_SCHEME" });
	});
});
