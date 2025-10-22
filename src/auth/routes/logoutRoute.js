// src/auth/routes/logoutRoute.js
import { Router } from "express";
import jwt from "jsonwebtoken";

import AppError from "../../../middlewares/AppError.js";
import authRequired from "../guards/authRequired.js";

import {
	logWarn,
	logError,
	logDebug,
	logSuccess,
} from "../../../terminalStylization/logger.js";

// Importa o denylist em modo "barreira de compatibilidade":
// (qualquer que seja a API exportada, tentamos usar de forma segura)
import * as denylist from "../tokens/tokenDenylist.memory.js";

export const router = Router();

/**
 * POST /auth/logout
 * Private — Invalidates current JWT (denylist in memory)
 * Requer: Authorization: Bearer <token>
 */
router.post("/logout", authRequired, async (req, res, next) => {
	try {
		// 1) Recupera o token do header ou (se teu authRequired setar) de req.token
		const authHeader = req.get("Authorization") || req.get("authorization") || "";
		const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
		const token = bearer || req.token || "";

		if (!token) {
			logWarn("❌ AUTHORIZATION TOKEN MISSING!");
			throw new AppError(
				"AUTHORIZATION TOKEN MISSING!",
				401,
				"AUTH",
				"ERR_TOKEN_MISSING"
			);
		}

		// 2) Tenta obter o exp (segundos Unix) — prioriza payload já validado pelo guard
		//    Se o guard não expôs, faz um decode simples (sem verificar assinatura)
		let exp = undefined;
		if (req.jwtPayload && typeof req.jwtPayload.exp === "number") {
			exp = req.jwtPayload.exp;
		} else {
			const decoded = jwt.decode(token);
			if (decoded && typeof decoded.exp === "number") exp = decoded.exp;
		}

		logDebug("🔒 LOGOUT REQUEST:", {
			user: req.user || req.auth || null,
			hasToken: Boolean(token),
			exp,
		});

		// 3) Coloca o token no denylist (se o módulo fornecer alguma função/estrutura)
		//    Compat: tentamos alguns nomes comuns sem quebrar se não existir.
		try {
			if (typeof denylist.add === "function") {
				denylist.add(token, exp);
			} else if (typeof denylist.deny === "function") {
				denylist.deny(token, exp);
			} else if (typeof denylist.push === "function") {
				denylist.push(token, exp);
			} else if (denylist.tokenDenylist && typeof denylist.tokenDenylist.add === "function") {
				denylist.tokenDenylist.add(token, exp);
			} else if (denylist.set instanceof Set) {
				// fallback humilde: se exportaram um Set
				denylist.set.add(token);
			} else if (denylist.list instanceof Set) {
				denylist.list.add(token);
			} else if (Array.isArray(denylist.list)) {
				denylist.list.push({ token, exp });
			}
			// Se não existir nenhuma API, seguimos só com o "logout" lógico (cliente descarta o token).
		} catch (e) {
			// Não falha o logout por causa do denylist — só registra
			logWarn("⚠️ Could not register token in denylist (non-fatal).");
			logError(e);
		}

		logSuccess("✅ LOGOUT SUCCESS");

		return res.success({
			statusCode: 200,
			message: "LOGOUT SUCCESSFUL!",
			data: { loggedOut: true },
		});
	} catch (err) {
		logError("❌ ERROR IN LOGOUT FUNCTION!");
		logError(err);

		if (err instanceof AppError) return next(err);

		return next(
			new AppError(
				"UNEXPECTED ERROR IN LOGOUT FUNCTION!",
				500,
				"LOGOUT",
				"ERR_LOGOUT_FAILED"
			)
		);
	}
});
