// src/auth/guards/authRequired.js
// IT'S A MIDDLEWARE
// Requires a real JWT to access routes in application.
import { verifyJwt } from '../tokens/verifyJwt.js';
import { tokenDenylist } from '../tokens/tokenDenylist.memory.js';
import AppError from '../../../middlewares/AppError.js';

export default async function authRequired(req, _res, next) {
	try {
		const auth = req.headers?.authorization;

		// 🔐 HTTP PROTOCOL VALIDATION - Ensures request has proper Bearer authentication
		// Responsibility: Validate HTTP layer, extract token for JWT specialist
		// Responsibility: HTTP KNOWLEDGE! NO PURE JTW!

		// Header ausente
		if (!auth || typeof auth !== 'string') {
			return next(new AppError('Missing Authorization header', 401, 'authorization', 'AUTH_MISSING'));
		}

		// Scheme inválido
		// Schema should be like this: "Authorization: Bearer <token>".
		// It checks: "O cliente está usando o protocolo Bearer ou tentou entrar com outro protocolo (Basic, Token, etc)?"
		if (!auth.startsWith('Bearer ')) {
			return next(new AppError('Invalid Authorization scheme', 401, 'authorization', 'AUTH_SCHEME'));
		}

		/*
		1️⃣ Extrai o token do header
		O header vem assim:
			Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
			O .slice(7) remove o texto "Bearer " (7 caracteres),
			ficando só com o JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

		2️⃣ Verifica se realmente há um token
			Se o header vier errado, tipo: Authorization: Bearer
		*/
		const token = auth.slice(7).trim();
		if (!token) {
			return next(new AppError('Empty bearer token', 401, 'authorization', 'AUTH_EMPTY'));
		}

		// Usa o modularized wrapper: { payload:{sub,role,...}, meta:{jti,iat,exp} }
		const { payload, meta } = verifyJwt(token); //Após a função verify ser chamada e cumprir a missão, o middleware volta a agir...
		//
		//...terminando o serviço:
		if (!meta || !meta.jti) {
			return next(new AppError('Token has no jti', 401, 'token', 'TOKEN_NO_JTI'));
		}

		if (await tokenDenylist.isRevoked(meta.jti)) {
			return next(new AppError('Token has been revoked', 401, 'token', 'TOKEN_REVOKED'));
		}

		// Aceita tanto sub quanto id no payload
		const id = payload?.sub ?? payload?.id;
		if (!id) {
			return next(new AppError('Token missing subject', 401, 'token', 'TOKEN_NO_SUB'));
		}

		req.user = {
			id: String(id),
			role: String(payload.role),
			jti: String(meta.jti),
			iat: meta.iat,
			exp: meta.exp };
		req.token = token;

		return next();
	} catch {
		return next(new AppError('Invalid or expired token', 401, 'token', 'AUTH_INVALID'));
	}
}
