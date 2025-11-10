import { expect, jest } from '@jest/globals';
import allowRoles from '../../../src/auth/guards/allowRoles.js';
// ✅ TESTE UNITÁRIO
// Testa APENAS allowRoles isoladamente
// Mocka as dependências (req.user)
// Rápido e focado

describe('allowRoles', () => {
	test('calls next when role is allowed', () => { //MIDDLEWARE SIMULATION!
		const guard = allowRoles('admin', 'manager'); //Accept admin OR maneger
		const req = { user: { role: 'admin' } }; // ← "Usuário fictício"
		const res = {}; // ← "Usuário fictício"
		const next = jest.fn();

		guard(req, res, next);
		expect(next).toHaveBeenCalledTimes(1);
	});

	test('throws when no roles provided', () => {
		expect(() => allowRoles()).toThrow(
			expect.objectContaining({
				"code": "ROLES_REQUIRED", "message": "allowRoles requires at least one role", "statusCode": 500
			})
		);
	});

	test('throws when user role is missing', () => {
		const guard = allowRoles('admin');
		const req = { user: {} };
		const res = {};
		const next = jest.fn();

		// ✅ CAPTURA E VERIFICA DETALHES:
		expect(() => guard(req, res, next)).toThrow(
			expect.objectContaining({
				statusCode: 403,
				code: 'ROLE_MISSING'
			})
		);

		expect(next).not.toHaveBeenCalled();
	});

	test('throws when role is not allowed', () => {
		const guard = allowRoles('admin');
		const req = { user: { role: 'user' } };
		const res = {};
		const next = jest.fn();

		expect(() => guard(req, res, next)).toThrow(
			expect.objectContaining({
				message: 'Forbidden',
				statusCode: 403,
				code: 'ROLE_FORBIDDEN'
			})
		);
		expect(next).not.toHaveBeenCalled();
	});
});
