// src/auth/guards/authRequired.js
import jwt from 'jsonwebtoken';
import { tokenDenylist } from '../tokens/tokenDenylist.memory.js';
import AppError from '../../../middlewares/AppError.js';

/**
 * Enforces authenticated access using a Bearer JWT.
 * - Validates header, verifies signature/exp
 * - Ensures jti and not denylisted
 * - Attaches claims to req.user
 */
export default async function authRequired(req, res, next) {
	try {
		const auth = req.headers?.authorization;

		if (!auth || typeof auth !== 'string' || auth.length < 8) {
			return next(new AppError('Missing Authorization header', 401, 'authorization', 'AUTH_MISSING'));
		}
		if (!auth.startsWith('Bearer ')) {
			return next(new AppError('Invalid Authorization scheme', 401, 'authorization', 'AUTH_SCHEME'));
		}

		const token = auth.slice(7).trim();
		if (!token) {
			return next(new AppError('Empty bearer token', 401, 'authorization', 'AUTH_EMPTY'));
		}

		const secret = process.env.JWT_SECRET;
		if (!secret) {
			return next(new AppError('Missing JWT_SECRET in .env', 500, 'env', 'JWT_SECRET_MISSING'));
		}

		let decoded;
		try {
			decoded = jwt.verify(token, secret);
		} catch {
			return next(new AppError('Invalid or expired token', 401, 'token', 'AUTH_INVALID'));
		}

		if (!decoded || typeof decoded.jti !== 'string' || decoded.jti.length === 0) {
			return next(new AppError('Token has no jti', 401, 'token', 'TOKEN_NO_JTI'));
		}

		const revoked = await tokenDenylist.isRevoked(decoded.jti);
		if (revoked) {
			return next(new AppError('Token has been revoked', 401, 'token', 'TOKEN_REVOKED'));
		}

		req.user = { id: decoded.id, role: decoded.role, jti: decoded.jti, iat: decoded.iat, exp: decoded.exp };
		req.token = token;
		return next();
	} catch (err) {
		// Any unexpected error bubbles here
		return next(new AppError('Auth guard failed unexpectedly', 500, 'auth', 'AUTH_GUARD_FAILURE'));
	}
}
