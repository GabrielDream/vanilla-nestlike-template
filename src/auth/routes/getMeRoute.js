import { Router } from 'express';
import { prisma } from '../../users/db/prisma.js';
import { logWarn, logError, logDebug, logSuccess } from '../../../terminalStylization/logger.js';
import AppError from '../../../middlewares/AppError.js';
import authRequired from '../guards/authRequired.js';

export const router = Router();

router.get('/me', authRequired, async (req, res, next) => {
	try {
		const userId = req?.user?.id;

		if (typeof userId !== 'string' || userId.length <= 0) {
			throw new AppError('Invalid Id!', 400, 'auth', 'AUTH_INVALID');
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				age: true,
				email: true,
				role: true
			}
		});

		if (!user) {
			throw new AppError('User not found!', 404, 'auth', 'ID_NOT_FOUND');
		}

		logSuccess('Search done!');

		return res.success({
			statusCode: 200,
			message: 'User found!',
			data: user
		});
	} catch (err) {
		logError('❌ ERROR FIND USERS:', err);

		if (err instanceof AppError) return next(err);

		return next(new AppError('UNEXPECTED ERROR IN getMe ROUTE!', 500, 'getME', 'ERR_GETME_FAILED'));
	}
});
