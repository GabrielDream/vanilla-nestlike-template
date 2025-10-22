import { Router } from "express";
import { prisma } from "../users/db/prisma.js"
import AppError from "../../middlewares/AppError.js"

import authRequired from "../auth/guards/authRequired.js"

import {
	logInfo,
	logWarn,
	logError,
	logDebug,
	logSuccess,
} from "../../terminalStylization/logger.js";

export const router = Router();

/**
 * GET /users
 * STAFF → retorna [id, name, email]
 * ADMIN → retorna [id, name, email, age, role, createdAt]
 */
router.get("/users", authRequired, async (req, res, next) => {
	try {
		logDebug("📄 FETCHING USERS LIST");

		let users;

		if (req.user.role === "ADMIN") {
			users = await prisma.user.findMany({
				select: {
					id: true,
					name: true,
					email: true,
					age: true,
					role: true,
					createdAt: true,
				},
			});
		} else if (req.user.role === "STAFF") {
			users = await prisma.user.findMany({
				select: {
					id: true,
					name: true,
					email: true,
				},
			});
		} else {
			throw new AppError(
				"INVALID ROLE DETECTED!",
				403,
				"LIST_USERS",
				"ERR_INVALID_ROLE"
			);
		}

		if (!users || users.length === 0) {
			logWarn("⚠️ NO USERS FOUND");
			return res.success({
				statusCode: 200,
				message: "LISTUSERS FUNCTION: NO USERS TO SHOW",
				data: [],
			});
		}

		logSuccess("✅ USERS FOUND!");
		logInfo("📄 RETURNING USERS LIST");

		return res.success({
			statusCode: 200,
			message: "LISTUSERS FUNCTION: SUCCESSFULLY SHOWN!",
			data: users,
		});
	} catch (err) {
		logError("❌ ERROR LISTING USERS:", err);

		if (err instanceof AppError) return next(err);

		return next(
			new AppError(
				"UNEXPECTED ERROR IN LIST USERS FUNCTION!",
				500,
				"LIST_USERS",
				"ERR_LISTUSERS_FAILED"
			)
		);
	}
});
