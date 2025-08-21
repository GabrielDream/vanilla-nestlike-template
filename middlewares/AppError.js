// middlewares/AppError.js
export default class AppError extends Error {
	constructor(message, statusCode = 500, field = null, code = 'ERR_GENERIC', errors = null) {
		super(message);
		this.name = 'AppError'; //just to make it clear

		// Validate and normalize the HTTP status code for error responses.
		// Only 4xx and 5xx codes are considered valid here. If an invalid
		// value is provided, default to 500 to guarantee a proper error status.
		let sc = Number(statusCode);
		if (!Number.isInteger(sc) || sc < 400 || sc > 599) {
			sc = 500;
		}

		this.statusCode = sc;
		this.field = field;
		this.code = code;
		this.errors = errors;
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	jsonResponseFormatter() {
		return {
			success: false,
			status: 'Error',
			message: this.message,
			field: this.field,
			code: this.code,
			errors: this.errors ?? [],
		};
	}
}
