import AppError from '../../middlewares/AppError';

export function sanitizeUserInput(input) {
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
