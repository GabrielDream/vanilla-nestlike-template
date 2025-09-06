import express from "express";
import { PrismaClient } from "@prisma/client";
import successHandler from "../../middlewares/successHandler.js";
import errorHandler from "../../middlewares/errorHandler.js";
import AppError from "../../middlewares/AppError.js";

export const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(successHandler);

// CREATE USER (para os testes de bridge)
app.post("/users", async (req, res, next) => {
  try {
    // sem optional chaining, sem ternário desnecessário
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const name = typeof body.name === "string" ? body.name : "John";
    const emailRaw = typeof body.email === "string" ? body.email : "john@example.com";
    const passwordHash = typeof body.passwordHash === "string" ? body.passwordHash : "hash";
    const age = Number.isInteger(body.age) ? body.age : undefined;

    // validações mínimas para o teste
    if (typeof name !== "string" || name.trim().length < 1) {
      throw new AppError("Nome inválido", 400, "name", "ERR_INVALID_NAME");
    }
    const email = emailRaw.trim().toLowerCase();
    if (email.indexOf("@") === -1) {
      throw new AppError("E-mail inválido", 400, "email", "ERR_INVALID_EMAIL");
    }
    if (!Number.isInteger(age) || age < 1 || age > 100) {
      throw new AppError("Idade inválida", 400, "age", "ERR_INVALID_AGE");
    }

    const created = await prisma.user.create({
      data: { name: name.trim(), email, passwordHash, age },
      select: { id: true, name: true, email: true, age: true },
    });

    // adapte aqui conforme seu successHandler (duas opções):
    // Opção A (success(message, data)):
    // return res.success("USER CREATED", created);

    // Opção B (success({statusCode, message, data})):
    return res.success({
      statusCode: 200,
      message: "USER CREATED",
      data: created,
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      // e-mail duplicado (único no banco)
      return next(new AppError("Email already registered", 409, "email", "P2002_DUPLICATE"));
    }
    return next(err);
  }
});

app.use(errorHandler);

export default app;
