// _tests_/bridgeUserRouteTest/app.bridge.user.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import successHandler from "../../middlewares/successHandler.js";
import errorHandler from "../../middlewares/errorHandler.js";
import AppError from "../../middlewares/AppError.js";

export const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(successHandler);

app.post("/users", async (req, res) => {
	try {
		const { name = "John", email = "john@example.com", passwordHash = "hash" } = req.body ?? {};
		const created = await prisma.user.create({ data: { name, email, passwordHash } });
		// nunca devolve hash real em produção; aqui é só teste
		return res.success({
			statusCode: 200,
			message: "USER CREATED",
			data: { id: created.id, email: created.email, name: created.name },
		});
	} catch (err) {
		if (err && err.code === "P2002") {
			throw new AppError(
				"E-mail já cadastrado",
				409,
				"email",
				"P2002_DUPLICATE");
		}
		throw err;
	}
});

app.use(errorHandler);

export default app;
