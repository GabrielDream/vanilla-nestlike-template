import { Router } from 'express';
import { prisma } from '../db/prisma.js';

import AppError from '../../../middlewares/AppError.js';

import authRequired from '../../auth/guards/authRequired.js';

import { logInfo, logWarn, logError, logDebug, logSuccess } from '../../../terminalStylization/logger.js';

export const router = Router();

/**
 * DELETE /users/me
 * STAFF can delete itself.
 * ADMIN cannot delete itself.
 */
router.delete('/users/me', authRequired, async (req, res, next) => {
	try {
		logDebug('🗑️ DELETE SELF FUNCTION CALLED!');

		const { id, role } = req?.user;

		// Block ADMIN from deleting itself -- DEFENSIVE PARANOIA
		if (role === 'ADMIN') {
			logWarn('❌ ADMIN tried to self-delete!');
			throw new AppError('ADMIN CANNOT DELETE ITSELF!', 403, 'DELETE_ME', 'ERR_ADMIN_SELF_DELETE');
		}

		// Check if user exists in DB
		const user = await prisma.user.findUnique({ where: { id } });
		logInfo(`🗑️ DELETE USER ID: ${id}`);

		//defensive paranoia -- If user id is not found, then his token no longer exists in db.
		if (!user) {
			logWarn(`USER NOT FOUND! ID: ${id}`);
			throw new AppError('USER NOT FOUND!', 404, 'user', 'ERR_USER_NOT_FOUND');
		}

		// Delete user
		await prisma.user.delete({ where: { id } });

		logSuccess(`🗑️ USER DELETED!
			NAME: ${user.name},
			EMAIL: ${user.email},
			AGE: ${user.age}`);

		return res.success({
			statusCode: 200,
			message: 'SUCCESSFULLY SELF-DELETED!'
		});
	} catch (err) {
		logError('❌ DELETE SELF ERROR:', err);

		if (err instanceof AppError) return next(err);

		//Prisma:
		if (err?.code === 'P2025') {
			return next(new AppError('User not found', 404, 'users', 'USER_NOT_FOUND'));
		}

		return next(new AppError('UNEXPECTED ERROR IN DELETE SELF FUNCTION!', 500, 'DELETE_ME', 'ERR_DELETE_ME_FAILED'));
	}
});
