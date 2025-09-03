import AppError from "../../../middlewares/AppError.js";

/**
 * Allows access only if req.user.role is in the allowed list.
 * Usage: app.get("/admin", authRequired, allowRoles("admin"), handler)
 */
export default function allowRoles(...roles) {
	if (!roles || roles.length === 0) {
		throw new Error("allowRoles requires at least one role");
	}

	return function (req, res, next) {
		const role = req?.user?.role;

		if (!role) {
			throw new AppError("Missing user role", 403, "auth", "ROLE_MISSING");
		}
		if (!roles.includes(role)) {
			throw new AppError("Forbidden", 403, "auth", "ROLE_FORBIDDEN");
		}

		return next();
	};
}
