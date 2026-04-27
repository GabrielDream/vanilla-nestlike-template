import AppError from './AppError.js';
import { logInfo, logDebug, logError, logWarn } from '../terminalStylization/logger.js';

export default function errorHandler(err, req, res, next) {
	logInfo('🚨 INTERCEPTED ERROR! ');
	logWarn('🚩 HANDLER ACTING NOW! 🚩');
	logDebug('[ INTERCEPTED BY errorHendler.js ]');
	logError(err);

	if (err instanceof AppError) {
		logDebug(`Kind of error: ----${err.constructor.name}----`);
		logWarn('⚠️  Software Error Detected! ⚠️');

		const body = err.jsonResponseFormatter();
		return res.status(err.statusCode).json(body);
	}

	logError('☠️ UNKNOWN ERROR!');
	return res.status(500).json({
		success: false,
		status: 'Unknown error',
		message: 'INTERNAL SERVER ERROR!',
		error: err.message
	});
}

const hello = 'test';
console.log(hello);
