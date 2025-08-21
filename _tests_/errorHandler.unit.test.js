import express from "express";
import request from "supertest";

import AppError from "../middlewares/AppError.js";
import errorHandler from "../middlewares/errorHandler.js";
import { logError, logInfo } from "../terminalStylization/logger.js";

//Silince logs
//jest.spyOn(logError, "bind").mockReturnValue(() => {});
//jest.spyOn(logWarn, "bind").mockReturnValue(() => {});
//jest.spyOn(logDebug, "bind").mockReturnValue(() => {});

describe("errorHandlerr middleware's test", () => {

	let app;

	beforeEach(() => {
		app = express();

		app.get("/testing-AppError", async (req, res, next) => {
			throw new AppError(
				"Custom AppError triggered",
				403,
				"email",
				"ERR_CUSTOM_APP"
			)

		});

		app.get("/unknonw-error", (req, res, next) => {
			throw new Error("Unexpected!");
		});

		app.use(errorHandler);
	})

	test("should treat AppError with correctly status and body", async () => {
		const res = await request(app).get("/testing-AppError");

		logInfo("TESTING:")
		logError("ERROR TYPE AppError! --- TESTING");

		expect(res.statusCode).toBe(403);
		expect(res.body).toEqual({
			success: false,
			status: "Error",
			message: "Custom AppError triggered",
			field: "email",
			code: "ERR_CUSTOM_APP",
			errors: []
		});
	});

	test("should return 500 for unknows erros", async () => {
		const res = await request(app).get("/unknonw-error");
		logInfo("TESTING:")
		logError("Unknow error!");

		expect(res.statusCode).toBe(500);
		expect(res.body).toEqual({
			success: false,
			status: 'Unknown error',
			message: 'INTERNAL SERVER ERROR!',
			error: "Unexpected!",
		})
	});
});
