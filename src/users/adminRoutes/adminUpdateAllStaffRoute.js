// src/users/adminRoutes/adminUpdateStaffRoute.js
// PUT /admin/users/:id — ADMIN atualiza qualquer STAFF (nunca a si mesmo, nunca outro ADMIN)
// Middlewares: authRequired + allowRoles('ADMIN')

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma.js';
import authRequired from '../../auth/guards/authRequired.js';
import allowRoles from '../../auth/guards/allowRoles.js';
import AppError from '../../../middlewares/AppError.js';
import { sanitizeUserInput } from '../../utils/sanitize.js';

export const router = Router();

router.put('/admin/users/:id', authRequired, allowRoles('ADMIN'), async (req, res, next) => {
	try {
		const userStaffId = String(req?.params?.id || '').trim();

		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userStaffId)) {
			throw new AppError('Invalid user staff id format', 400, 'users', 'INVALID_ID_STAFF_FORMAT');
		}

		const requesterId = String(req?.user?.id || '').trim();

		if (userStaffId === requesterId) {
			throw new AppError('Admin cannot update own profile', 403, 'users', 'ADMIN_SELF_UPDATE_FORBIDDEN');
		}

		// Alvo precisa existir e NÃO pode ser ADMIN
		const target = await prisma.user.findUnique({
			where: { id: userStaffId },
			select: { id: true, name: true, email: true, age: true, role: true, passwordHash: true }
		});

		if (!target) throw new AppError('User not found', 404, 'users', 'ID_NOT_FOUND');
		if (target.role === 'ADMIN')
			throw new AppError('Cannot update another admin', 403, 'users', 'UPDATE_ADMIN_FORBIDDEN');

		// Admin can change: name, email, age and password
		const sanitizedBody = sanitizeUserInput(req.body || {});

		// Garante que veio pelo menos 1 campo permitido
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

		if (name !== undefined && name !== target.name) {
			updateData.name = name;
			hasChange = true;
		}

		if (email !== undefined && email !== target.email) {
			updateData.email = email;
			hasChange = true;
		}

		if (age !== undefined && age !== target.age) {
			updateData.age = age;
			hasChange = true;
		}

		if (password !== undefined) {
			//Essa nova senha é igual à antiga senha quando eu uso bcrypt para comparar?"
			const isSame = await bcrypt.compare(password, target.passwordHash);
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
			where: { id: userStaffId },
			data: updateData,
			select: { id: true, name: true, email: true, age: true, role: true }
		});

		return res.success({
			statusCode: 200,
			message: 'Staff updated successfully',
			data: {
				updated: true,
				user: updated
			}
		});
	} catch (err) {
		// Conflito único de email
		if (err && typeof err === 'object' && err.code === 'P2002') {
			return next(new AppError('Email already in use', 400, 'users', 'EMAIL_IN_USE'));
		}
		if (err instanceof AppError) return next(err);
		return next(new AppError('Update failed', 500, 'users', 'UPDATE_FAILED'));
	}
});
