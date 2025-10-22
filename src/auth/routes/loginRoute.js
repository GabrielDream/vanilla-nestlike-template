// src/auth/routes/loginRoute.js
import { Router } from "express";
import { prisma } from "../../users/db/prisma.js";
import bcrypt from "bcrypt";

import AppError from "../../../middlewares/AppError.js";

import {
	logWarn,
	logError,
	logDebug,
	logSuccess,
} from "../../../terminalStylization/logger.js";

import { sanitizeUserInput } from "../../utils/sanitize.js";
import { signJwt } from "../tokens/signJwt.js";

export const router = Router();

/**
 * POST /auth/login
 * Public — Authenticate a user and return JWT
 * Fields: email (string), password (string)
 */
router.post("/login", async (req, res, next) => {
	try {
		const sanitizedBody = sanitizeUserInput(req.body);

		let { email, password } = sanitizedBody;
		email = String(email || "").trim().toLowerCase();

		logDebug("📥 LOGIN REQUEST BODY:", { email });

		// -------------------------
		// VALIDATIONS
		// -------------------------
		if (!email || !password) {
			logWarn("EMAIL AND PASSWORD ARE REQUIRED!");
			throw new AppError(
				"EMAIL AND PASSWORD ARE REQUIRED!",
				400,
				"all",
				"ERR_MISSING_FIELDS"
			);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new AppError(
				"INVALID EMAIL FORMAT!",
				400,
				"EMAIL",
				"ERR_INVALID_EMAIL"
			);
		}

		// -------------------------
		// LOOKUP USER
		// -------------------------
		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				name: true,
				age: true,
				email: true,
				role: true,
				passwordHash: true,
			},
		});

		if (!user) {
			logWarn("INVALID CREDENTIALS! (user not found)");
			throw new AppError(
				"INVALID CREDENTIALS!",
				401,
				"AUTH",
				"ERR_INVALID_CREDENTIALS"
			);
		}

		// -------------------------
		// CHECK PASSWORD
		// -------------------------
		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			logWarn("INVALID CREDENTIALS! (wrong password)");
			throw new AppError(
				"INVALID CREDENTIALS!",
				401,
				"AUTH",
				"ERR_INVALID_CREDENTIALS"
			);
		}

		// -------------------------
		// SIGN JWT
		// -------------------------
		const token = signJwt({ id: user.id, role: user.role });

		logSuccess(`✅ LOGIN SUCCESS: ${email}`);

		return res.success({
			statusCode: 200,
			message: "LOGIN SUCCESSFUL!",
			data: {
				token,
				user: {
					id: user.id,
					name: user.name,
					age: user.age,
					email: user.email,
					role: user.role,
				},
			},
		});
	} catch (err) {
		logError("❌ ERROR IN LOGIN FUNCTION!");
		logError(err);

		if (err instanceof AppError) return next(err);

		return next(
			new AppError(
				"UNEXPECTED ERROR IN LOGIN FUNCTION!",
				500,
				"LOGIN",
				"ERR_LOGIN_FAILED"
			)
		);
	}
});

