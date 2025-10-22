import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

import { signJwt } from "../../../src/auth/tokens/signJwt.js";
import { tokenDenylist } from "../../../src/auth/tokens/tokenDenylist.memory.js";

import authRequired from "../../../src/auth/guards/authRequired.js";
import allowRoles from "../../../src/auth/guards/allowRoles.js";
import isSelfOrRoles from "../../../src/auth/guards/isSelfOrRoles.js";

import AppError from "../../../middlewares/AppError.js";

describe("Auth smoke (integration)", () => {
	beforeAll(() => {
		// Stable secret for tests
		process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
	});

	afterEach(async () => {
		await tokenDenylist._clear();
	});

	function makeApp() {
		const app = express();

		// Protected: /me
		app.get("/me", authRequired, (req, res) => {
			return res.status(200).json({ ok: true, user: req.user });
		});

		// Protected + roles: /admin
		app.get("/admin", authRequired, allowRoles("admin"), (req, res) => {
			return res.status(200).json({ ok: true, admin: true, user: req.user });
		});

		// Protected + self or roles: /users/:id
		app.put("/users/:id", authRequired, isSelfOrRoles("admin"), (req, res) => {
			return res.status(200).json({ ok: true, updatedId: req.params.id, by: req.user.id });
		});

		// Logout: revoke current token until natural expiration
		app.post("/auth/logout", authRequired, async (req, res, next) => {
			try {
				const now = Math.floor(Date.now() / 1000);
				const ttlSec = Math.max(1, (req.user.exp ?? now) - now);
				await tokenDenylist.revoke(req.user.jti, ttlSec);
				return res.status(204).send(); // No Content
			} catch (err) {
				return next(err);
			}
		});

		// Minimal error handler mapping AppError -> 4xx; unknown -> 500
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

	test("POST /auth/logout revokes the token (subsequent /me -> 401 TOKEN_REVOKED)", async () => {
		const app = makeApp();
		const token = signJwt({ id: "u1", role: "user" }, "10m");

		// logout
		const out = await request(app)
			.post("/auth/logout")
			.set("Authorization", `Bearer ${token}`)
			.send();

		expect([200, 204]).toContain(out.status); // 204 preferred

		// try again with the same token
		const res = await request(app)
			.get("/me")
			.set("Authorization", `Bearer ${token}`)
			.send();

		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, code: "TOKEN_REVOKED" });
	});

	test("GET /me protected: 200 with token; 401 without header", async () => {
		const app = makeApp();
		const good = signJwt({ id: "u2", role: "user" }, "15m");

		const ok = await request(app)
			.get("/me")
			.set("Authorization", `Bearer ${good}`)
			.send();

		expect(ok.status).toBe(200);
		const dec = jwt.verify(good, process.env.JWT_SECRET);
		expect(ok.body.user).toEqual(
			expect.objectContaining({ id: "u2", role: "user", jti: dec.jti })
		);

		const missing = await request(app).get("/me").send();
		expect(missing.status).toBe(401);
		expect(missing.body).toMatchObject({ success: false, code: "AUTH_MISSING" });
	});

	test("GET /admin + allowRoles('admin'): 200 admin; 403 non-admin", async () => {
		const app = makeApp();
		const adminToken = signJwt({ id: "a1", role: "admin" }, "15m");
		const userToken = signJwt({ id: "u3", role: "user" }, "15m");

		const adminRes = await request(app)
			.get("/admin")
			.set("Authorization", `Bearer ${adminToken}`)
			.send();
		expect(adminRes.status).toBe(200);
		expect(adminRes.body).toMatchObject({ ok: true, admin: true });

		const userRes = await request(app)
			.get("/admin")
			.set("Authorization", `Bearer ${userToken}`)
			.send();
		expect(userRes.status).toBe(403);
		expect(userRes.body).toMatchObject({ success: false, code: "ROLE_FORBIDDEN" });
	});

	test("PUT /users/:id + isSelfOrRoles('admin'): 200 self; 200 admin; 403 third non-admin", async () => {
		const app = makeApp();

		const selfTok = signJwt({ id: "u10", role: "user" }, "10m");
		const adminTok = signJwt({ id: "a10", role: "admin" }, "10m");
		const thirdTok = signJwt({ id: "u11", role: "user" }, "10m");

		// self
		const selfRes = await request(app)
			.put("/users/u10")
			.set("Authorization", `Bearer ${selfTok}`)
			.send();
		expect(selfRes.status).toBe(200);
		expect(selfRes.body).toMatchObject({ ok: true, updatedId: "u10" });

		// admin acting on another id
		const adminRes = await request(app)
			.put("/users/u10")
			.set("Authorization", `Bearer ${adminTok}`)
			.send();
		expect(adminRes.status).toBe(200);

		// third user (not self, not admin)
		const thirdRes = await request(app)
			.put("/users/u10")
			.set("Authorization", `Bearer ${thirdTok}`)
			.send();
		expect(thirdRes.status).toBe(403);
		expect(thirdRes.body).toMatchObject({ success: false, code: "SELF_OR_ROLE_FORBIDDEN" });
	});
});
