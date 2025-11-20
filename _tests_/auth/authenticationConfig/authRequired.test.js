import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

import authRequired from '../../../src/auth/guards/authRequired.js';
import { signJwt } from '../../../src/auth/tokens/signJwt.js';
import { tokenDenylist } from '../../../src/auth/tokens/tokenDenylist.memory.js';
import successHandler from '../../../middlewares/successHandler.js';
import AppError from '../../../middlewares/AppError.js';

describe('authRequired (integration smoke)', () => {
	beforeAll(() => {
		// Stable secret for tests
		process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
	});

	afterEach(async () => {
		await tokenDenylist._clear();
	});

	function makeApp() {
		const app = express();

		app.use(successHandler);

		// Route protected by the guard
		app.get('/me', authRequired, (req, res) => {
			return res.success({
				message: 'AuthRequired middleware is intercepting!',
				data: req.user
			});
		});

		// Minimal error handler mapping AppError -> 4xx; unknown -> 500
		// Must be AFTER routes to catch thrown errors
		// eslint-disable-next-line no-unused-vars
		app.use((err, req, res, next) => {
			if (err instanceof AppError) {
				return res.status(err.statusCode).json({
					success: false,
					code: err.code,
					message: err.message
				});
			}
			return res.status(500).json({
				success: false,
				code: 'ERR_INTERNAL',
				message: 'INTERNAL SERVER ERROR'
			});
		});

		return app;
	}

	test('200 on valid token (req.user attached)', async () => {
		const app = makeApp();
		const token = signJwt({ id: 'u1', role: 'user' }, '15m');

		const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`).send();

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			// ✅ TESTA A ESTRUTURA COMPLETA DO res.success()
			success: true,
			status: 'Success',
			statusCode: 200,
			message: 'AuthRequired middleware is intercepting!',
			data: expect.objectContaining({
				id: 'u1',
				role: 'user',
				jti: expect.any(String),
				iat: expect.any(Number),
				exp: expect.any(Number)
			}),
			meta: {},
			timeStamp: expect.any(String)
		});

		// ✅ VERIFICA O JTI ESPECÍFICO
		const dec = jwt.verify(token, process.env.JWT_SECRET);
		expect(res.body.data.jti).toBe(dec.jti); // ← data.jti
	});

	test('401 when Authorization header is missing', async () => {
		const app = makeApp();

		const res = await request(app).get('/me').send();

		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, code: 'AUTH_MISSING' });
	});

	test('401 when token is denylisted (revoked)', async () => {
		const app = makeApp();

		// 1. Cria um token válido
		const token = signJwt({ id: 'u2', role: 'user' }, '10m');

		// 2. Decodifica para pegar o jti
		const dec = jwt.verify(token, process.env.JWT_SECRET);
		// dec = { id: 'u2', role: 'user', jti: 'abc123', exp: 123456, iat: 123455 }

		// 3. Calcula quanto tempo falta para expirar
		const now = Math.floor(Date.now() / 1000); // timestamp atual em segundos
		const ttlSec = Math.max(1, dec.exp - now); // tempo restante em segundos
		// Exemplo: se expira em 10min, ttlSec = 600

		// 4. REVOGA o token (coloca na denylist)
		await tokenDenylist.revoke(dec.jti, ttlSec);
		// ↑ "Token abc123 está revogado pelos próximos 600 segundos"

		const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`).send();

		expect(res.status).toBe(401);
		expect(res.body).toEqual({
			success: false,
			code: 'TOKEN_REVOKED',
			message: 'Token has been revoked' // ← MENSAGEM ESPECÍFICA!
		});
	});

	test('401 when Authorization scheme is invalid (Basic)', async () => {
		const app = makeApp();

		const res = await request(app).get('/me').set('Authorization', 'Basic abc123').send();

		expect(res.status).toBe(401);
		expect(res.body).toMatchObject({ success: false, code: 'AUTH_SCHEME' });
	});
});
