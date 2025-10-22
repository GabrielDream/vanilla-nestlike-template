// _tests_/auth/signJwt.unit.test.js
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { signJwt } from '../../../src/auth/tokens/signJwt.js';

describe('signJwt (TTL + jti core)', () => {
	const originalEnv = { ...process.env };
	afterEach(() => {
		process.env = { ...originalEnv };
	});

	test('uses .env JWT_EXPIRES_IN when no param provided', () => {
		process.env.JWT_EXPIRES_IN = '45m';
		const token = signJwt({ id: 'u1', role: 'user' } /*no param*/);
		const dec = jwt.verify(token, process.env.JWT_SECRET);
		const ttl = dec.exp - dec.iat; // ~2700s
		expect(ttl).toBeGreaterThanOrEqual(2699);
		expect(ttl).toBeLessThanOrEqual(2701);
	});

	test('string expiresIn overrides .env', () => {
		process.env.JWT_EXPIRES_IN = '1d';
		const token = signJwt({ id: 'u2', role: 'user' }, '15m');
		const dec = jwt.verify(token, process.env.JWT_SECRET);
		const ttl = dec.exp - dec.iat; // ~900s
		expect(ttl).toBeGreaterThanOrEqual(899);
		expect(ttl).toBeLessThanOrEqual(901);
	});

	test('numeric expiresIn (seconds) overrides .env', () => {
		process.env.JWT_EXPIRES_IN = '1d';
		const token = signJwt({ id: 'u3', role: 'user' }, 2);
		const dec = jwt.verify(token, process.env.JWT_SECRET);
		const ttl = dec.exp - dec.iat; // ~2s
		expect(ttl).toBeGreaterThanOrEqual(1);
		expect(ttl).toBeLessThanOrEqual(3);
	});

	test('emits unique jti per token', () => {
		const t1 = signJwt({ id: 'u4', role: 'user' }, '1h');
		const t2 = signJwt({ id: 'u4', role: 'user' }, '1h');
		const d1 = jwt.verify(t1, process.env.JWT_SECRET);
		const d2 = jwt.verify(t2, process.env.JWT_SECRET);
		expect(d1.jti).not.toBe(d2.jti);
	});
});
