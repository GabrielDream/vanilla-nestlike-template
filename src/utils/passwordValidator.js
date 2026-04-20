// src/utils/passwordValidator.js
export function validateStrongPassword(password) {
	const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password);

	if (!strong) {
		throw new AppError('INVALID PASSWORD', 400, 'password', 'ERR_INVALID_PASSWORD');
	}
}
