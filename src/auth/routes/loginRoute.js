// src/auth/routes/loginRoute.js
// Rota publica também!
import { Router } from 'express';
import { prisma } from '../../users/db/prisma.js';
import bcrypt from 'bcrypt';

import AppError from '../../../middlewares/AppError.js';

import { logWarn, logError, logDebug, logSuccess } from '../../../terminalStylization/logger.js';

import { sanitizeUserInput } from '../../utils/sanitize.js';
import { signJwt } from '../tokens/signJwt.js';

export const router = Router();

/**
 * POST /auth/login
 * Public — Authenticate a user and return JWT
 * Fields: email (string), password (string)
 */
router.post('/login', async (req, res, next) => {
	try {
		const sanitizedBody = sanitizeUserInput(req.body);

		let { email, password } = sanitizedBody;

		logDebug('📥 LOGIN REQUEST BODY:', { email });

		// -------------------------
		// BASIC VALIDATIONS
		// -------------------------
		if (!email || !password) {
			logWarn('EMAIL AND PASSWORD ARE REQUIRED!');
			throw new AppError('EMAIL AND PASSWORD ARE REQUIRED!', 400, 'all', 'ERR_MISSING_FIELDS');
		}

		email = String(email ?? '')
			.trim()
			.toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new AppError('INVALID EMAIL FORMAT!', 400, 'EMAIL', 'ERR_INVALID_EMAIL');
		}

		password = String(password ?? '');
		if (password.length < 8 || password.length > 128) {
			throw new AppError('INVALID CREDENTIALS!', 401, 'AUTH', 'ERR_INVALID_CREDENTIALS');
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
				passwordHash: true
			}
		});

		// -------------------------
		// AFTER LOGIN CHECK VALIDATIONS
		// -------------------------
		if (!user) {
			// ✅ Timing Attack Protection
			const dummyHash = process.env.DUMMY_BCRYPT_HASH || '$2b$12$NhS8e9J7OVQZyUVf6QPRd.DD8W5J2..eVvJyv6WllP6sZJY5QY5Qa';

			try {
				logDebug('🛡️ Executing timing attack protection for non-existent user');
				await bcrypt.compare(password, dummyHash); // ⏱️ Equaliza tempo de resposta
			} catch (bcryptError) {
				logDebug('🛡️ Timing attack protection completed (with bcrypt error):', bcryptError.message);
			}

			// 🎯 Rejeita login independente do resultado do timing attack
			logWarn('INVALID CREDENTIALS! (user not found)');
			throw new AppError('INVALID CREDENTIALS!', 401, 'AUTH', 'ERR_INVALID_CREDENTIALS');
		}

		const isValid = await bcrypt.compare(password, user.passwordHash);
		if (!isValid) {
			logWarn('INVALID CREDENTIALS! (wrong password)');
			throw new AppError('INVALID CREDENTIALS!', 401, 'AUTH', 'ERR_INVALID_CREDENTIALS');
		}

		// -------------------------
		// SIGN JWT
		// -------------------------
		const token = signJwt({ id: user.id, role: user.role });

		logSuccess(`✅ LOGIN SUCCESS: ${email}`);

		return res.success({
			statusCode: 200,
			message: 'LOGIN SUCCESSFUL!',
			data: {
				token,
				user: {
					id: user.id,
					name: user.name,
					age: user.age,
					email: user.email,
					role: user.role
				}
			}
		});
	} catch (err) {
		logError('❌ ERROR IN LOGIN FUNCTION!');
		logError(err);

		if (err instanceof AppError) return next(err);

		return next(new AppError('UNEXPECTED ERROR IN LOGIN FUNCTION!', 500, 'LOGIN', 'ERR_LOGIN_FAILED'));
	}
});
