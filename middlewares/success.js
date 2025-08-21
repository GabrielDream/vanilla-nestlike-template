// A helper function of success=
import { logSuccess, logData, logTimeStamp } from "../terminalStylization/logger.js";

export default ({ res, statusCode = 200, message = 'Success', data = {}, meta = {} }) => {
	const response = {
		success: true,
		status: 'Success',
		message,
		data,
		meta,
		timeStamp: new Date().toISOString()
	};

	logSuccess(`${message} (StatusCode: ${statusCode})`);
	logData(data);
	logTimeStamp(response.timeStamp);

	//RESPONSE TO JSON:
	return res.status(statusCode).json(response);
}
