//Middleware to use success function inside the aplication (res.success)
import success from './success.js';

export default (req, res, next) => {
	res.success = (options = {}) => {
		return success({ res, ...options });
	};
	return next();
};
