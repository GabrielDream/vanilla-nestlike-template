// logoutRoute.js
import { Router } from 'express';
import authRequired from '../guards/authRequired.js';
import { tokenDenylist } from '../tokens/tokenDenylist.memory.js';
import AppError from '../../../middlewares/AppError.js'; // ⬅️ NÃO ESQUECER!

export const router = Router();

router.post('/logout', authRequired, async (req, res, next) => {
	//Não existe cenário em que alguém desloga outra pessoa sem ter o token dela. Se tem o token, já é essa pessoa pro sistema.
	try {
		const { jti, exp } = req.user;

		// 🛡️ VALIDAÇÕES DE SEGURANÇA
		if (typeof jti !== 'string' || jti.trim() === '') {
			throw new AppError('Invalid token identifier', 400, 'AUTH', 'ERR_INVALID_JTI');
		}

		if (typeof exp !== 'number' || !Number.isInteger(exp)) {
			throw new AppError('Invalid token expiration', 400, 'AUTH', 'ERR_INVALID_EXP');
		}

		const now = Math.floor(Date.now() / 1000);

		// ✅ AGORA SIMPLES - já validamos que exp é number
		let ttlSec = exp - now;

		// Garante mínimo 1 segundo para o denylist não rejeitar
		if (ttlSec < 1) {
			ttlSec = 1;
		}

		await tokenDenylist.revoke(jti, ttlSec);

		return res.success({
			message: 'LOGOUT SUCCESSFUL!',
			data: { loggedOut: true }
		});
	} catch (err) {
		next(err);
	}
});
