import AppError from '../../middlewares/AppError.js';

export function sanitizeUserInput(input) {
	if (typeof input !== 'object' || input === null) {
		throw new AppError('INVALID_INPUT', 400, 'body', 'ERR_INVALID_INPUT');
	}

	const allowedFields = new Set(['name', 'age', 'email', 'password']);
	const sanitized = {};

	for (const key of Object.keys(input)) {
		if (!allowedFields.has(key)) {
			throw new AppError('EXTRA FIELDS ARE NOT ALLOWED', 400, 'body', 'ERR_EXTRA_FIELDS');
		}
		sanitized[key] = input[key];
	}

	return sanitized;
}



/*
export function sanitizeUserInput(input) {

	if (typeof input !== 'object' || input === null) {
		throw new AppError('INVALID_INPUT', 400, 'body', 'ERR_INVALID_INPUT');
	}

	const allowedFields = ['name', 'age', 'email', 'password'];
	const sanitized = {};

	for (const key of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(input, key)) {
			sanitized[key] = input[key];
		}
	}

	const extraFields = Object.keys(input).filter((field) => {
		const isAllowed = allowedFields.includes(field);
		return !isAllowed;
	});

	if (extraFields.length > 0) {
		throw new AppError(`EXTRA FIELDS ARE NOT ALLOWED: ${extraFields.join(', ')}`, 400, 'body', 'ERR_EXTRA_FIELDS');
	}

	return sanitized;
}
*/
