import jwt from "jsonwebtoken";
import { tokenDenylist } from "../tokens/tokenDenylist.memory.js";
import AppError from "../../../middlewares/AppError.js";

/**
 * Enforces authenticated access using a Bearer JWT.
 * - Validates "Authorization: Bearer <token>"
 * - Verifies signature/exp with JWT_SECRET
 * - Ensures the token has a jti and is not denylisted
 * - Attaches decoded claims to req.user
 */
export default async function authRequired(req, res, next) {
	// Get header
	const headers = req.headers || {};
	const auth = headers.authorization;

	// Validate header
	if (!auth || typeof auth !== "string" || auth.length < 8) {
		throw new AppError("Missing Authorization header", 401, "authorization", "AUTH_MISSING");
	}
	if (!auth.startsWith("Bearer ")) {
		throw new AppError("Invalid Authorization scheme", 401, "authorization", "AUTH_SCHEME");
	}

	const token = auth.slice(7).trim();
	if (!token) {
		throw new AppError("Empty bearer token", 401, "authorization", "AUTH_EMPTY");
	}

	// Verify signature and expiration
	let decoded;
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("Missing JWT_SECRET in .env");
	}
	try {
		decoded = jwt.verify(token, secret);
	} catch (err) {
		// jsonwebtoken throws on bad signature or expired token
		throw new AppError("Invalid or expired token", 401, "token", "AUTH_INVALID");
	}

	// Must have jti for revocation checks
	if (!decoded || typeof decoded.jti !== "string" || decoded.jti.length === 0) {
		throw new AppError("Token has no jti", 401, "token", "TOKEN_NO_JTI");
	}

	// Denylist (logout) check
	const revoked = await tokenDenylist.isRevoked(decoded.jti);
	if (revoked) {
		throw new AppError("Token has been revoked", 401, "token", "TOKEN_REVOKED");
	}

	// Attach to request for downstream handlers
	req.user = {
		id: decoded.id,
		role: decoded.role,
		jti: decoded.jti,
		iat: decoded.iat,
		exp: decoded.exp,
	};
	// (Optional) expose raw token if you need it later
	req.token = token;

	return next();
}
