import { Router } from "express";
import { prisma } from "../users/db/prisma.js"

import AppError from "../../middlewares/AppError.js";

import authRequired from "../../src/auth/guards/authRequired.js";
import allowRoles from "../../src/auth/guards/allowRoles.js";

import {
	logInfo,
	logWarn,
	logError,
	logDebug,
	logSuccess,
} from "../../terminalStylization/logger.js";

export const router = Router();

// Simple UUID v4/any-version validator (defensive)
function isUuid(value = "") {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		String(value).trim()
	);
}

/**
 * DELETE /users/:id
 * Only ADMIN can delete USERS.
 * Rules:
 *  - Never delete another ADMIN (target role === 'ADMIN' → 403)
 *  - Never allow admin to delete itself (params.id === req.user.id → 403)
 *  - Validate UUID format (400)
 *  - 404 if user not found
 */
router.delete("/users/:id", authRequired, allowRoles("ADMIN"), async (req, res, next) => {
	try {
		logDebug("🗑️ ADMIN DELETE FUNCTION CALLED!");

		const { id } = req.params;
		const requesterId = req.user.id;

		// Validate UUID format
		if (!isUuid(id)) {
			logWarn("❌ INVALID ID FORMAT!");
			throw new AppError("INVALID USER ID!", 400, "id", "ERR_INVALID_ID");
		}

		// Prevent admin from deleting itself
		if (id === requesterId) {
			logWarn("❌ ADMIN tried to delete itself via /users/:id");
			throw new AppError(
				"ADMIN CANNOT DELETE ITSELF!",
				403,
				"DELETE_BY_ADMIN",
				"ERR_ADMIN_SELF_DELETE"
			);
		}

		// Fetch target user
		const target = await prisma.user.findUnique({ where: { id } });
		logInfo(`🗑️ ADMIN DELETE TARGET ID: ${id}`);

		if (!target) {
			logWarn(`USER NOT FOUND! ID: ${id}`);
			throw new AppError("USER NOT FOUND!", 404, "id", "ERR_USER_NOT_FOUND");
		}

		// Never delete another ADMIN
		if (target.role === "ADMIN") {
			logWarn("❌ Attempt to delete an ADMIN user!");
			throw new AppError(
				"CANNOT DELETE AN ADMIN USER!",
				403,
				"DELETE_BY_ADMIN",
				"ERR_DELETE_ADMIN_BLOCKED"
			);
		}

		// Proceed with deletion (STAFF)
		await prisma.user.delete({ where: { id } });

		logSuccess(`🗑️ USER DELETED BY ADMIN!
      NAME: ${target.name},
      EMAIL: ${target.email},
      AGE: ${target.age},
      ROLE: ${target.role}`);

		return res.success({
			statusCode: 200,
			message: "SUCCESSFULLY DELETED!",
		});
	} catch (err) {
		logError("❌ ADMIN DELETE ERROR:", err);

		if (err instanceof AppError) return next(err);

		return next(
			new AppError(
				"UNEXPECTED ERROR IN ADMIN DELETE FUNCTION!",
				500,
				"DELETE_BY_ADMIN",
				"ERR_ADMIN_DELETE_FAILED"
			)
		);
	}
});
