import express from 'express';
import { prisma } from '../../src/users/db/prisma.js';
import successHandler from '../../middlewares/successHandler.js';
import errorHandler from '../../middlewares/errorHandler.js';
import AppError from '../../middlewares/AppError.js';

const app = express();

app.use(express.json());
app.use(successHandler);

// CREATE USER (para os testes de bridge)
app.post('/users', async (req, res, next) => {
	try {
		// Valores base.
		// Variáveis com valores padrão usadas apenas para tornar o bridge mais resiliente a payloads ausentes durante testes.
		// No caso, o req.body sempre vem completo nos testes, então esses defaults são opcionais e servem só como fallback didático. Como "garantia" e "boas praticas".

		let name = 'John';
		let emailRaw = 'john@example.com';
		let passwordHash = 'hash';
		let age;

		// Atribuições seguras a partir de req.body
		if (req.body && typeof req.body.name === 'string') {
			name = req.body.name;
		}
		if (req.body && typeof req.body.email === 'string') {
			emailRaw = req.body.email;
		}
		if (req.body && typeof req.body.passwordHash === 'string') {
			passwordHash = req.body.passwordHash;
		}
		if (req.body && Number.isInteger(req.body.age)) {
			age = req.body.age;
		}

		// Validações mínimas
		if (typeof name !== 'string' || name.trim().length < 1) {
			throw new AppError('Nome inválido', 400, 'name', 'ERR_INVALID_NAME');
		}

		const email = emailRaw.trim().toLowerCase();
		if (email.indexOf('@') === -1) {
			throw new AppError('E-mail inválido', 400, 'email', 'ERR_INVALID_EMAIL');
		}

		if (!Number.isInteger(age) || age < 1 || age > 100) {
			throw new AppError('Idade inválida', 400, 'age', 'ERR_INVALID_AGE');
		}

		// Persistência
		const created = await prisma.user.create({
			data: { name: name.trim(), email, passwordHash, age },
			select: { id: true, name: true, email: true, age: true }
		});

		// Success response (conforme teu handler)
		return res.success({
			statusCode: 200,
			message: 'USER CREATED',
			data: created
		});
	} catch (err) {
		if (err && err.code === 'P2002') {
			// e-mail duplicado
			return next(new AppError('Email already registered', 409, 'email', 'P2002_DUPLICATE'));
		}
		return next(err);
	}
});

app.use(errorHandler);

export default app;
