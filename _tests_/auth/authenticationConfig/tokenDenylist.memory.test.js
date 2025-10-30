import { jest } from '@jest/globals';
import { tokenDenylist } from '../../../src/auth/tokens/tokenDenylist.memory.js';

describe('tokenDenylist (unit)', () => {
	beforeAll(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	afterEach(async () => {
		await tokenDenylist._clear();
	});

	test('revoke marks jti and auto-expires after TTL', async () => {
		const jti = 'JTI_A';
		await tokenDenylist.revoke(jti, 1);
		expect(await tokenDenylist.isRevoked(jti)).toBe(true);

		jest.advanceTimersByTime(1100);
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);
	});

	test('TTL <= 0 throws', async () => {
		await expect(tokenDenylist.revoke('JTI_B0', 0)).rejects.toThrow();
		await expect(tokenDenylist.revoke('JTI_BN', -5)).rejects.toThrow();
		await expect(tokenDenylist.revoke('JTI_BNaN', NaN)).rejects.toThrow();
	});

	test('re-revoking extends lifetime (old timer is cleared)', async () => {
		const jti = 'JTI_R';
		await tokenDenylist.revoke(jti, 1);
		// Antes do primeiro TTL expirar, estende o tempo
		jest.advanceTimersByTime(900);
		await tokenDenylist.revoke(jti, 3);

		// Passaria o primeiro TTL (1.1s), mas deve continuar revogado
		jest.advanceTimersByTime(1100);
		expect(await tokenDenylist.isRevoked(jti)).toBe(true);

		// Agora deixa completar os ~3s totais
		jest.advanceTimersByTime(2000);
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);
	});

	test('_clear cancels timers and clears store', async () => {
		const jti = 'JTI_CLR';
		await tokenDenylist.revoke(jti, 5);
		expect(await tokenDenylist.isRevoked(jti)).toBe(true);

		await tokenDenylist._clear();
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);

		// Avança o tempo — não deve disparar nenhum timer residual
		jest.advanceTimersByTime(6000);
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);
	});

	test('multiple revoke calls do not throw and keep revoked until last TTL', async () => {
		const jti = 'JTI_ID';
		await tokenDenylist.revoke(jti, 2);
		await tokenDenylist.revoke(jti, 2);
		await tokenDenylist.revoke(jti, 2);

		expect(await tokenDenylist.isRevoked(jti)).toBe(true);
		jest.advanceTimersByTime(2100);
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);
	});
});
