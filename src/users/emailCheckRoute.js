//Route use by everyone
import { Router } from 'express';
import { prisma } from './db/prisma.js';

import {
	logInfo,
	logWarn,
	logError,
	logDebug,
	logSuccess,
	logData,
	logTimeStamp
} from '../../terminalStylization/logger.js';

import AppError from '../../middlewares/AppError.js';

export const router = Router();

// -------------------------
// CHECK EMAIL (UX helper)
// -------------------------
router.get('/checkEmail/:email', async (req, res, next) => {
	try {
		const raw = req.params.email || '';
		const email = String(raw).trim().toLowerCase();

		logDebug(`🔍--CHECKING EMAIL ${email}`);

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			logError('❌ EMAIL IS INVALID!');
			throw new AppError('EMAIL IS INVALID!', 400, 'email', 'ERR_INVALID_EMAIL');
		}

		const exists = await prisma.user.findUnique({
			where: { email },
			select: { id: true }
		});

		if (exists) logWarn(`🚫 IN USE: ${email}`);
		else logSuccess(`✅ AVAILABLE: ${email}`);

		return res.success({
			success: true,
			message: `${email} checked successfully.`,
			data: { exists: Boolean(exists) }
		});
	} catch (err) {
		logWarn('❌ Error to check Email!');
		logError(err);

		if (err instanceof AppError) return next(err);

		return next(new AppError('ERROR TO CHECK EMAIL!', 500, 'EMAIL', 'ERR_EMAIL_CHECK_FAILED', err));
	}
});
