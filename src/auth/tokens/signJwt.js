// src/auth/tokens/signJwt.js     ---FÁBRICA DE TOKENS

// This script GENERATES (signs) a JWT for a user.
// It reads secrets from .env, sets expiration time, and includes a unique jti.
// Contract: signJwt(payload, expiresIn?) -> string JWT
import { logWarn } from '../../../../AdvancedCrud/utils/logger';
import crypto from 'node:crypto'; // Import Node's native module to generate UUID (jti).
import jwt from 'jsonwebtoken'; // Library for signing/verifying JSON Web Tokens.

// signJwt(payload, expiresIn?) → returns a signed JWT; adds jti and uses JWT_EXPIRES_IN || "1d"
export function signJwt(payload, expiresIn) {
	// 'payload' is an object from the DB (e.g., { id, role }).
	const secret = process.env.JWT_SECRET; // Read the secret from .env (key used to sign the token).
	if (!secret) {
		// If no secret is configured...
		throw new Error('JWT_SECRET missing in .env'); // ...stop: it's not safe to sign without a secret.
	}

	let ttl = '1d'; // Default token TTL (time to live); by default, 1 day.

	//VALIDATIONS to garantee that token always gonna have a value:
	// If JWT_EXPIRES_IN exists in .env and is a non-empty string, use that value as TTL (e.g., "1h", "2d").
	if (typeof process.env.JWT_EXPIRES_IN === 'string') {
		const v = process.env.JWT_EXPIRES_IN.trim(); // Remove leading/trailing whitespace, making ttl as a default value if process.env.JTW_EXPIRES_IN came empty.
		if (v.length > 0) {
			ttl = v; // Assign the .env value to TTL (the library will convert it to 'exp').
		}
	}
	// If the function received 'expiresIn' as a string (e.g., "30m"), prioritize this value over .env.
	if (typeof expiresIn === 'string') {
		const v = expiresIn.trim();

		// ✅ NOVA VALIDAÇÃO: verifica se é formato de tempo válido
		if (v.length > 0 && /^(\d+)(s|m|h|d|w|y)$/.test(v)) {
			ttl = v;
		} else if (v.length > 0) {
			// ⚠️ Formato inválido - loga warning mas usa default
			logWarn(`Invalid JWT expiresIn format: "${v}". Using default.`);
			// Mantém ttl atual (do .env ou default)
		}
		// Or, if it received a number (seconds), use it as TTL (e.g., 900 = 15 minutes).
	} else if (typeof expiresIn === 'number') {
		if (Number.isFinite(expiresIn) && expiresIn > 0) {
			ttl = expiresIn; // Numeric TTL in seconds.
		}
	}

	// Configuration object passed to jwt.sign:
	const signingConfig = {
		jwtid: crypto.randomUUID(), // Generate a unique token identifier (jti) — useful for revocation/logout.
		expiresIn: ttl, // Tells the library the TTL; it will internally calculate 'exp' (epoch seconds).
	};

	// Create (sign) the token:
	// - 'payload': user data to be embedded in the token (id, role, etc.).
	// - 'secret': secret key for HMAC signature (HS256 by default).
	// - 'signingConfig': includes jti and expiration.
	return jwt.sign(payload, secret, signingConfig);
}
/*// RESPONSABILIDADE: CRIAR tokens novos
// INPUT: dados do usuário + configurações
// OUTPUT: string do token (pronto para enviar ao cliente)

// Exemplo de USO:
const token = signJwt(
  { id: user.id, role: user.role }, // ← PAYLOAD = dados do usuário
  '7d' // ← expiresIn personalizado
);*/
