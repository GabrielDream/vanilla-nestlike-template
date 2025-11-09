// src/auth/guards/allowRoles.js
//A MIDDLEWARE FACTORY!
import AppError from '../../../middlewares/AppError.js';

/**
 * Allows access only if req.user.role is included in allowed roles.
 * Throws AppError on missing/forbidden role (sync), so unit tests can expect .toThrow(AppError).
 */

export default function allowRoles(...roles) { //Rest spread params (...roles) ou Array (roles)
	if (!roles || roles.length === 0) {
		throw new Error('allowRoles requires at least one role');
	}

	return function (req, _res, next) {
		const role = req?.user?.role;

		if (!role) {
			// keep 403 to match your test assertion
			throw new AppError('Missing user role', 403, 'auth', 'ROLE_MISSING');
		}

		if (!roles.includes(role)) {
			// keep 403 to match test assertion
			throw new AppError('Forbidden', 403, 'auth', 'ROLE_FORBIDDEN');
		}

		return next();
	};
}
