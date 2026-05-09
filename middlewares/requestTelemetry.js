import { logDebug } from "../terminalStylization/logger.js";

export default function requestTelemetry(req, res, next) {
	const startedAt = Date.now();

	res.on('finish', () => {
		const durationMiliSeconds = Date.now() - startedAt;

		logDebug(`[TELEMETRY WORKING:] ${req.method} - ${req.originalUrl} - status="${res.statusCode}" - duration in Ms="${durationMiliSeconds}"`)
	})

	next();
}
