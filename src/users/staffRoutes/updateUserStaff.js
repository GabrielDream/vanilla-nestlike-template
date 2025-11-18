// src/users/staffRoutes/updateUserStaff.js
// PUT /users/:id — STAFF self-update (name, email, password)
// Middlewares: authRequired + isSelfOrRoles(): Para fins didáticos. Para variação de estilo, pois o padrão é: rotas me: somente me, sem ID! Aqui abro a exceção.

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma.js';
import authRequired from '../../auth/guards/authRequired.js';
import isSelfOrRoles from '../../auth/guards/isSelfOrRoles.js';
import AppError from '../../../middlewares/AppError.js';
import { sanitizeUserInput } from '../../utils/sanitize.js';

export const router = Router();

router.put('/users/:id', authRequired, isSelfOrRoles(), async (req, res, next) => {
	try {
		/*const pathIdRaw = req.params && req.params.id
		let pathId = ''
		if (typeof pathIdRaw === 'string') pathId = pathIdRaw
		if (pathId.length === 0) {
			throw new AppError('Invalid user id', 400, 'users', 'INVALID_ID')
		}

		const target = await prisma.user.findUnique({
			where: { id: pathId },
			select: { id: true, name: true, email: true, passwordHash: true }
		})
		if (!target) {
			throw new AppError('User not found', 404, 'users', 'ID_NOT_FOUND')
		}
*/

		const userId = String(req?.params?.id || '').trim();

		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
			throw new AppError('Invalid user id format', 400, 'users', 'INVALID_ID_FORMAT');
		}

		const foundId = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, email: true, age: true, passwordHash: true }
		});

		if (!foundId) {
			throw new AppError('User not found', 404, 'users', 'ID_NOT_FOUND');
		} // Nota: esse 404 é paranoia defensiva — com isSelfOrRoles() a rota só aceita self, então esse ramo só dispara se o usuário for removido do banco após autenticar. Se passou pelo authRequired, o user TEM token e TEM id — o isSelfOrRoles só verifica permissão, nunca existência.

		// sanitizeUserInput já rejeita qualquer campo extra (ERR_EXTRA_FIELDS)
		// e só deixa passar: name, age, email, password. Já está validado na propria função.
		const sanitizedBody = sanitizeUserInput(req.body || {});

		//Extra security layer about role: Defensive paranoia.
		if (Object.prototype.hasOwnProperty.call(sanitizedBody, 'role')) {
			throw new AppError('Forbidden field: role', 403, 'users', 'FORBIDDEN_FIELDS');
		}

		// 2) Garante que veio pelo menos 1 campo permitido
		if (Object.keys(sanitizedBody).length === 0) {
			throw new AppError('At least one field must be provided', 400, 'users', 'NO_FIELDS_TO_UPDATE');
		}

		let { name, age, email, password } = sanitizedBody;

		if (name !== undefined) {
			if (typeof name !== 'string' || /\d/.test(name) || name.trim().length < 1) {
				throw new AppError('Invalid name', 400, 'users', 'INVALID_NAME');
			}
			name = name.trim();
		}

		if (email !== undefined) {
			const normalized = String(email).trim().toLowerCase();
			const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

			if (!isValid) {
				throw new AppError('Invalid email', 400, 'users', 'INVALID_EMAIL');
			}
			email = normalized;
		}

		if (age !== undefined) {
			if (age === '') {
				throw new AppError('Invalid age', 400, 'users', 'INVALID_AGE');
			}
			const ageNum = Number(age);
			const valid = !Number.isNaN(ageNum) && Number.isInteger(ageNum) && ageNum >= 1 && ageNum <= 100;
			if (!valid) {
				throw new AppError('Invalid age', 400, 'users', 'INVALID_AGE');
			}
			age = ageNum;
		}

		if (password !== undefined) {
			if (typeof password !== 'string') {
				throw new AppError('Invalid password', 400, 'users', 'INVALID_PASSWORD');
			}

			const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password);
			if (!strong) {
				throw new AppError('Invalid password', 400, 'users', 'INVALID_PASSWORD');
			}
		}

		const updateData = {};
		let hasChange = false;

		if (name !== undefined && name !== foundId.name) {
			updateData.name = name;
			hasChange = true;
		}

		if (email !== undefined && email !== foundId.email) {
			updateData.email = email;
			hasChange = true;
		}

		if (age !== undefined && age !== foundId.age) {
			updateData.age = age;
			hasChange = true;
		}

		if (password !== undefined) {
			//Essa nova senha é igual à antiga senha quando eu uso bcrypt para comparar?"
			const isSame = await bcrypt.compare(password, foundId.passwordHash);
			if (!isSame) {
				const newHash = await bcrypt.hash(password, 10);
				updateData.passwordHash = newHash;
				hasChange = true;
			}
		}

		if (!hasChange) {
			throw new AppError('Nothing to update', 400, 'users', 'NO_CHANGES');
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: { id: true, name: true, age: true, email: true, role: true } // nunca expõe hash
		});

		return res.success({
			statusCode: 200,
			message: 'USER UPDATED SUCCESSFULLY',
			data: {
				updated: true,
				user: updated
			}
		});
	} catch (err) {
		// Mapear conflict de e-mail (P2002) de forma limpa
		if (err && typeof err === 'object' && err.code === 'P2002') {
			return next(new AppError('Email already in use', 400, 'users', 'EMAIL_IN_USE'));
		}
		if (err instanceof AppError) return next(err);
		return next(new AppError('Update failed', 500, 'users', 'UPDATE_FAILED'));
	}
});
