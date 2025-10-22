import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { prisma } from '../../../src/users/db/prisma.js';
import { router as logoutRouter } from '../../../src/auth/routes/logoutRoute.js';
import { signJwt } from '../../../src/auth/tokens/signJwt.js';

// middlewares
import successHandler from '../../../middlewares/successHandler.js';
import errorHandler from '../../../middlewares/errorHandler.js';

// Vamos mockar apenas o denylist do projeto (nosso código), que é simples:
import * as denylist from '../../../src/auth/tokens/tokenDenylist.memory.js';

const app = express();
app.use(express.json());
app.use(successHandler);
app.use('/auth', logoutRouter);
app.use(errorHandler);

beforeAll(async () => {
	await prisma.$connect();
});

afterEach(async () => {
	await prisma.user.deleteMany();
	jest.restoreAllMocks();
});

afterAll(async () => {
	await prisma.$disconnect();
});

describe('POST /auth/logout', () => {
	it('✅ 200 - should logout with valid token', async () => {
		const user = await prisma.user.create({
			data: {
				name: 'Log Outer',
				age: 30,
				email: 'logout@example.com',
				passwordHash: 'hash',
				role: 'STAFF',
			},
		});

		const token = signJwt({ id: user.id, role: user.role });

		const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`).send();

		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('LOGOUT SUCCESSFUL!');
		expect(res.body.data).toMatchObject({ loggedOut: true });
	});

	it('❌ 401 - should return 401 when token is missing', async () => {
		const res = await request(app).post('/auth/logout').send();

		expect(res.statusCode).toBe(401);
		expect(res.body.success).toBe(false);
		// Mensagem vem do authRequired; aceitamos variação mas deve indicar auth/token
		expect(String(res.body.message).toUpperCase()).toMatch(/AUTH|TOKEN/);
	});

	it('⚠️ 200 - denylist failure should NOT break logout', async () => {
		const user = await prisma.user.create({
			data: {
				name: 'Deny Fail',
				age: 22,
				email: 'deny@example.com',
				passwordHash: 'hash',
				role: 'STAFF',
			},
		});
		const token = signJwt({ id: user.id, role: user.role });

		// Força uma falha no denylist (qualquer método que a tua implementação use)
		// Tentamos 'add' primeiro; se não existir, tentamos 'deny' etc.
		const candidates = ['add', 'deny', 'push'];
		const originalSpies = [];
		for (const fnName of candidates) {
			if (typeof denylist[fnName] === 'function') {
				const spy = jest.spyOn(denylist, fnName).mockImplementation(() => {
					throw new Error('denylist boom');
				});
				originalSpies.push(spy);
				break;
			}
		}

		// Se tua implementação expõe algo como tokenDenylist.add:
		if (originalSpies.length === 0 && denylist.tokenDenylist?.add) {
			originalSpies.push(
				jest.spyOn(denylist.tokenDenylist, 'add').mockImplementation(() => {
					throw new Error('denylist boom');
				}),
			);
		}

		const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`).send();

		// Mesmo com erro no denylist, o logout deve continuar OK:
		expect(res.statusCode).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.message).toBe('LOGOUT SUCCESSFUL!');

		// limpa spies
		for (const s of originalSpies) s.mockRestore();
	});
});
