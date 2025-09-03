import { jest } from "@jest/globals";
import { tokenDenylist } from "../../src/auth/tokens/tokenDenylist.memory.js";

describe("tokenDenylist (unit)", () => {
	beforeAll(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	afterEach(async () => {
		await tokenDenylist._clear();
	});

	test("revoke marks jti and auto-expires after TTL", async () => {
		const jti = "JTI_A";
		await tokenDenylist.revoke(jti, 1);
		expect(await tokenDenylist.isRevoked(jti)).toBe(true);
		jest.advanceTimersByTime(1100);
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);
	});

	test("TTL <= 0 is clamped to 1s", async () => {
		const jti = "JTI_B";
		await tokenDenylist.revoke(jti, 0);
		expect(await tokenDenylist.isRevoked(jti)).toBe(true);
		jest.advanceTimersByTime(1100);
		expect(await tokenDenylist.isRevoked(jti)).toBe(false);
	});
});
