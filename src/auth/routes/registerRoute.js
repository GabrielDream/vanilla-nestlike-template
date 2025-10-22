///register, /login, /logout

import { Router } from 'express';
import { prisma } from '../../users/db/prisma.js';
import bcrypt from 'bcrypt';

import AppError from '../../../middlewares/AppError.js';

import {
	logInfo,
	logWarn,
	logError,
	logDebug,
	logSuccess,
	logData,
	logTimeStamp,
} from '../../../terminalStylization/logger.js';

import { sanitizeUserInput } from '../../utils/sanitize.js';

//import authRequired from "./guards/authRequired.js";

export const router = Router();

/**
 * POST /auth/register
 * Public — Create a STAFF user
 * Fields: name (string), age (int 1-100), email (string), password (string forte)
 */

router.post('/register', async (req, res, next) => {
	try {
		const sanitizedBody = sanitizeUserInput(req.body);

		let { name, age, email, password } = sanitizedBody;
		email = String(email || '')
			.trim()
			.toLowerCase();
		sanitizedBody.email = email;

		logDebug('📥 REGISTER REQUEST BODY: ', sanitizedBody);

		// -------------------------
		// VALIDATIONS
		// -------------------------
		if (!name || !age || !email || !password) {
			logWarn('ALL FIELDS ARE REQUIRED!');
			throw new AppError('ALL FIELDS NEED TO BE FILLED!', 400, 'all', 'ERR_MISSING_FIELDS');
		}

		if (typeof name !== 'string' || /\d/.test(name) || name.trim().length < 1) {
			throw new AppError('ADD FUNCTION: INVALID NAME!', 400, 'NAME', 'ERR_INVALID_NAME');
		}

		const convertedAgeNumber = Number(age);
		if (
			!Number.isInteger(convertedAgeNumber) ||
			Number.isNaN(convertedAgeNumber) ||
			convertedAgeNumber < 1 ||
			convertedAgeNumber > 100
		) {
			logWarn('INVALID AGE!');
			throw new AppError('ADD FUNCTION: INVALID AGE!', 400, 'age', 'ERR_INVALID_AGE');
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new AppError('INVALID EMAIL FORMAT!', 400, 'EMAIL', 'ERR_INVALID_EMAIL');
		}

		const existingEmail = await prisma.user.findUnique({
			where: { email },
		});
		if (existingEmail) {
			logWarn('EMAIL IN USE!');
			throw new AppError('EMAIL ALREADY IN USE!', 400, 'EMAIL', 'ERR_EMAIL_IN_USE');
		}

		const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
		const passwordHash = await bcrypt.hash(password, rounds);
		// password strength
		if (typeof password !== 'string' || password.length < 8) {
			throw new AppError('PASSWORD TOO SHORT', 400, 'PASSWORD', 'ERR_WEAK_PASSWORD');
		}

		const newUser = await prisma.user.create({
			data: {
				name,
				age: convertedAgeNumber,
				email,
				passwordHash,
				role: 'STAFF', // força sempre STAFF
			},
			select: {
				id: true,
				name: true,
				age: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		logSuccess(`✅ NEW USER REGISTERED: Name: ${name}, Email: ${email}, Age: ${convertedAgeNumber}`);

		return res.success({
			statusCode: 201,
			message: 'SUCCESSFULLY REGISTERED!',
			data: {
				newUser,
			},
		});
	} catch (err) {
		logError('❌ ERROR IN REGISTER FUNCTION!');
		logError(err);

		if (err instanceof AppError) return next(err);

		// Prisma duplicate error fallback
		if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
			return next(new AppError('EMAIL ALREADY IN USE!', 400, 'EMAIL', 'ERR_EMAIL_IN_USE'));
		}

		return next(new AppError('UNEXPECTED ERROR IN REGISTER FUNCTION!', 500, 'REGISTER', 'ERR_REGISTER_FAILED'));
	}
});
