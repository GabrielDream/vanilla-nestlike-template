import express from "express";
import { PrismaClient } from "@prisma/client";
import successHandler from "../../middlewares/successHandler.js";
import errorHandler from "../../middlewares/errorHandler.js";
import AppError from "../../middlewares/AppError.js";

export const prisma = new PrismaClient(); // instância única p/ os testes
export const app = express();

app.use(express.json());
app.use(successHandler);

// ✅ success
app.get('successMidleware', (req, res, _next) => {
	return res.json({
		statusCode: 200,
		message: "OK from bridge",
	})
});

// ❌ P2002: duplicated email
app.post("/error/p2002", async (req, res, _next) => {
  try {
    const email = "dup@example.com";
    await prisma.user.create({ data: { name: "A", email, passwordHash: "x" } });
    await prisma.user.create({ data: { name: "B", email, passwordHash: "y" } }); // deve lançar P2002
    return res.success({ message: "não deveria chegar aqui" });
  } catch (err) {
    if (err && err.code === "P2002") {
      throw new AppError("E-mail já cadastrado", 409, "email", "P2002_DUPLICATE");
    }
    throw new AppError("Erro de banco de dados", 500, null, "DB_GENERIC");
  }
});



