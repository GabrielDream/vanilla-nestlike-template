// src/webhooks/security/createHmacSignatureRequired.js
import crypto from 'crypto';
import AppError from '../../../middlewares/AppError.js';

export default function createHmacSignatureRequired({
	headerName,
	secretEnv,
	algorithm = 'sha256',
	digestEncoding = 'hex',
	parseSignature = (v) => v
}) {
	return function signatureRequired(req, _res, next) {
		try {
			const secret = process.env[secretEnv];
			if (!secret) return next(new AppError('WEBHOOK_SECRET_MISSING', 500, 'env', 'ERR_WEBHOOK_SECRET'));

			const signatureHeader = req.get(headerName);
			if (!signatureHeader)
				return next(new AppError('SIGNATURE_HEADER_MISSING', 401, 'header', 'ERR_SIGNATURE_HEADER'));

			const rawBody = req.rawBody;
			if (!rawBody) return next(new AppError('RAWBODY_ABSENT', 500, 'rawBody', 'ERR_RAWBODY_ABSENT'));

			const signature = parseSignature(signatureHeader);

			const expected = crypto.createHmac(algorithm, secret).update(rawBody, 'utf8').digest(digestEncoding);

			const sigA = Buffer.from(signature, digestEncoding);
			const sigB = Buffer.from(expected, digestEncoding);

			const match = sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);
			if (!match) return next(new AppError('INVALID_SIGNATURE', 401, 'header', 'ERR_SIGNATURE_INVALID'));

			return next();
		} catch (err) {
			return next(err);
		}
	};
}
