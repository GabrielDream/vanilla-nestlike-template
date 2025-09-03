// src/auth/tokens/signJwt.js
import crypto from "node:crypto"; //Core NODE.JS. Dont need to import in package.
import jwt from "jsonwebtoken";

// signJwt(payload, expiresIn?) → return assigned JWT; Add jti and use JWT_EXPIRES_IN || "1d"

export function signJwt(payload, expiresIn) { //payload is a object came of DB (role, id)
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET ausente no .env");
	}

	let ttl = "1d";

	if (typeof process.env.JWT_EXPIRES_IN === "string") {
		const v = process.env.JWT_EXPIRES_IN.trim();
		if (v.length > 0) {
			ttl = v; // ex: "1h"
		}
	}

	if (typeof expiresIn === "string") {
		const v = expiresIn.trim();
		if (v.length > 0) {
			ttl = v;
		}
	} else if (typeof expiresIn === "number") {
		if (Number.isFinite(expiresIn) && expiresIn > 0) {
			ttl = expiresIn; // seconds
		}
	}

	const signingConfig = {
		jwtid: crypto.randomUUID(), // unique token ID (jti) used for revocation (logout)
		expiresIn: ttl,             // token lifetime; library computes exp from this
	};

	//MAKING TOKEN:
	return jwt.sign(payload, secret, signingConfig);
}
