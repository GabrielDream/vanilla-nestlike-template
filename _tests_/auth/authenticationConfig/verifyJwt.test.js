// _tests_/auth/authenticationConfig/verifyJwt.unit.test.js
import 'dotenv/config';

import { signJwt } from '../../../src/auth/tokens/signJwt.js';
import { verifyJwt } from '../../../src/auth/tokens/verifyJwt.js';

const originalEnv = { ...process.env };

beforeEach(() => {
	process.env.JWT_SECRET = 'testsecret';
	delete process.env.JWT_EXPIRES_IN;
});

afterEach(() => {
	process.env = { ...originalEnv };
});

describe('verifyJwt (core)', () => {
	test('returns payload and meta for a valid token', () => {
		const token = signJwt({ id: 'u1', role: 'user' }, '2m');
		const { payload, meta } = verifyJwt(token);

		expect(payload).toMatchObject({ id: 'u1', role: 'user' });
		expect(typeof meta.jti).toBe('string');
		expect(typeof meta.iat).toBe('number');
		expect(typeof meta.exp).toBe('number');
		expect(meta.exp).toBeGreaterThan(meta.iat);
	});

	test('throws if token is tampered (secret mismatch)', () => {
		const token = signJwt({ id: 'u2', role: 'user' }, '2m');
		process.env.JWT_SECRET = 'different-secret';
		expect(() => verifyJwt(token)).toThrow();
	});

	test('throws TokenExpiredError when token is expired', async () => {
		const token = signJwt({ id: 'u3', role: 'user' }, 1); // 1s
		await new Promise((r) => setTimeout(r, 1500));
		expect(() => verifyJwt(token)).toThrow(/expired/i);
	});

	test('throws when JWT_SECRET is missing', () => {
		const token = signJwt({ id: 'u4', role: 'user' }, '1m'); // still signed with previous secret
		delete process.env.JWT_SECRET;
		expect(() => verifyJwt(token)).toThrow(/JWT_SECRET/i);
	});

	test('throws when token is not a non-empty string', () => {
		expect(() => verifyJwt()).toThrow();
		expect(() => verifyJwt('')).toThrow();
		expect(() => verifyJwt('   ')).toThrow();
	});
});
