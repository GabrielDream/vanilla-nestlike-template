import { jest } from "@jest/globals";
import isSelfOrRoles from "../../src/auth/guards/isSelfOrRoles.js";
import AppError from "../../middlewares/AppError.js";

describe("isSelfOrRoles", () => {
	test("passes when user is self (matches req.params.id)", () => {
		const guard = isSelfOrRoles(); // self-only
		const req = { user: { id: "u1", role: "user" }, params: { id: "u1" } };
		const res = {};
		const next = jest.fn();

		guard(req, res, next);
		expect(next).toHaveBeenCalledTimes(1);
	});

	test("passes when role is allowed (even if not self)", () => {
		const guard = isSelfOrRoles("admin");
		const req = { user: { id: "u2", role: "admin" }, params: { id: "u1" } };
		const res = {};
		const next = jest.fn();

		guard(req, res, next);
		expect(next).toHaveBeenCalledTimes(1);
	});

	test("throws when neither self nor allowed role", () => {
		const guard = isSelfOrRoles("admin", "manager");
		const req = { user: { id: "u2", role: "user" }, params: { id: "u1" } };
		const res = {};
		const next = jest.fn();

		expect(() => guard(req, res, next)).toThrow(AppError);
		try {
			guard(req, res, next);
		} catch (e) {
			expect(e).toMatchObject({ statusCode: 403, code: "SELF_OR_ROLE_FORBIDDEN" });
		}
		expect(next).not.toHaveBeenCalled();
	});

	test("throws when target id param is missing", () => {
		const guard = isSelfOrRoles("admin");
		const req = { user: { id: "u1", role: "admin" }, params: {} };
		const res = {};
		const next = jest.fn();

		expect(() => guard(req, res, next)).toThrow(AppError);
		try {
			guard(req, res, next);
		} catch (e) {
			expect(e).toMatchObject({ statusCode: 403, code: "SELF_OR_ROLE_MISSING_TARGET" });
		}
		expect(next).not.toHaveBeenCalled();
	});
});
