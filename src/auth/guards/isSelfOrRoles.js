import AppError from '../../../middlewares/AppError.js';

/**
 * Allows access if the current user is the target user (req.params.id)
 * OR if the current user's role is in the allowed list.
 * Usage: app.put("/users/:id", authRequired, isSelfOrRoles("admin"), handler)
 */
export default function isSelfOrRoles(...roles) {
	// roles can be empty → "self only" mode
	return function (req, res, next) {
		const userId = req?.user?.id;
		const userRole = req?.user?.role;
		const targetId = req?.params?.id;

		if (!userId) {
			throw new AppError('Missing user id', 403, 'auth', 'SELF_OR_ROLE_MISSING_USER');
		}
		if (typeof targetId !== 'string' || targetId.trim().length === 0) {
			throw new AppError('Missing target id param', 403, 'auth', 'SELF_OR_ROLE_MISSING_TARGET');
		}

		const isSelf = userId === targetId;
		const roleAllowed = roles.length > 0 && roles.includes(userRole);

		if (!isSelf && !roleAllowed) {
			throw new AppError('Forbidden', 403, 'auth', 'SELF_OR_ROLE_FORBIDDEN');
		}

		return next();
	};
}
