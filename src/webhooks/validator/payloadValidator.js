import AppError from '../../../middlewares/AppError.js';

export function validateWebhookCore(input) {
	if (typeof input !== 'object' || input === null) {
		throw new AppError('INVALID_INPUT', 400, 'body', 'ERR_INVALID_INPUT');
	}

	const contract = new Set(['eventId', 'eventType', 'data']);

	for (const requiredKey of contract) {
		if (!(requiredKey in input)) {
			throw new AppError('INVALID_WEBHOOK_CONTRACT', 400, 'body', 'ERR_CONTRACT');
		}
	}

	return true;
}
