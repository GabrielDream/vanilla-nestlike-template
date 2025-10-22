import { jest } from '@jest/globals';
import allowRoles from '../../../src/auth/guards/allowRoles.js';
import AppError from '../../../middlewares/AppError.js';

describe('allowRoles', () => {
	test('calls next when role is allowed', () => {
		const guard = allowRoles('admin', 'manager');
		const req = { user: { role: 'admin' } };
		const res = {};
		const next = jest.fn();

		guard(req, res, next);
		expect(next).toHaveBeenCalledTimes(1);
	});

	test('throws when user role is missing', () => {
		const guard = allowRoles('admin');
		const req = { user: {} };
		const res = {};
		const next = jest.fn();

		expect(() => guard(req, res, next)).toThrow(AppError);
		try {
			guard(req, res, next);
		} catch (e) {
			expect(e).toMatchObject({ statusCode: 403, code: 'ROLE_MISSING' });
		}
		expect(next).not.toHaveBeenCalled();
	});

	test('throws when role is not allowed', () => {
		const guard = allowRoles('admin');
		const req = { user: { role: 'user' } };
		const res = {};
		const next = jest.fn();

		expect(() => guard(req, res, next)).toThrow(AppError);
		try {
			guard(req, res, next);
		} catch (e) {
			expect(e).toMatchObject({ statusCode: 403, code: 'ROLE_FORBIDDEN' });
		}
		expect(next).not.toHaveBeenCalled();
	});
});
