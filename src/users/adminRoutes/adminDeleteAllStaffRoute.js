import { Router } from 'express';
import { prisma } from '../db/prisma.js';

import AppError from '../../../middlewares/AppError.js';

import authRequired from '../../auth/guards/authRequired.js';
import allowRoles from '../../auth/guards/allowRoles.js';

import { logInfo, logWarn, logError, logDebug, logSuccess } from '../../../terminalStylization/logger.js';

export const router = Router();
/**
 * DELETE /users/:id
 * Only ADMIN can delete USERS.
 * Rules:
 *  - Never delete another ADMIN (target role === 'ADMIN' → 403)
 *  - Never allow admin to delete itself (params.id === req.user.id → 403)
 *  - Validate UUID format (400)
 *  - 404 if user not found
 */

router.delete('/admin/users/:id', authRequired, allowRoles('ADMIN'), async (req, res, next) => {
	try {
		logDebug('🗑️ ADMIN DELETE FUNCTION CALLED!');

		const userId = String(req?.params?.id || '').trim();

		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
			throw new AppError('Invalid user staff id format', 400, 'users', 'INVALID_ID_STAFF_FORMAT');
		}

		const requesterId = String(req?.user?.id || '').trim();
		// Prevent admin from deleting itself
		if (userId === requesterId) {
			logWarn('❌ ADMIN tried to delete itself via /users/:id');
			throw new AppError('ADMIN CANNOT DELETE ITSELF!', 403, 'DELETE_BY_ADMIN', 'ERR_ADMIN_SELF_DELETE');
		}

		// Fetch target user
		const target = await prisma.user.findUnique({ where: { id: userId } });
		logInfo(`🗑️ ADMIN DELETE TARGET ID: ${userId}`);

		//DEFENSIVE:
		if (!target) {
			logWarn(`USER NOT FOUND! ID: ${userId}`);
			throw new AppError('USER NOT FOUND!', 404, 'id', 'ERR_USER_NOT_FOUND');
		}
		if (target.role === 'ADMIN') {
			logWarn('❌ Attempt to delete an ADMIN user!');
			throw new AppError('CANNOT DELETE AN ADMIN USER!', 403, 'DELETE_BY_ADMIN', 'ERR_DELETE_ADMIN_BLOCKED');
		}

		// Proceed with deletion (STAFF)
		await prisma.user.delete({ where: { id: userId } });

		logSuccess(`🗑️ USER DELETED BY ADMIN!
      NAME: ${target.name},
      EMAIL: ${target.email},
      AGE: ${target.age}`);

		return res.success({
			statusCode: 200,
			message: 'SUCCESSFULLY DELETED!',
			data: {
				deleted: true,
				userId: userId
			}
		});
	} catch (err) {
		logError('❌ ADMIN DELETE ERROR:', err);

		if (err instanceof AppError) return next(err);

		return next(
			new AppError('UNEXPECTED ERROR IN ADMIN DELETE FUNCTION!', 500, 'DELETE_BY_ADMIN', 'ERR_ADMIN_DELETE_FAILED')
		);
	}
});
