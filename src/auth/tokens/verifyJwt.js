// src/auth/tokens/verifyJwt.js

// This script VALIDATES a JWT received from the client.
// It checks signature and expiration, and returns the clean payload + meta claims.
// Contract: verifyJwt(token) -> { payload, meta: { jti, iat, exp } }
// - token: raw JWT string (no "Bearer " prefix)
// - throws on invalid/expired tokens (TokenExpiredError, JsonWebTokenError)

import jwt from 'jsonwebtoken';

export function verifyJwt(token) {
	// Basic input validation:
	// 🔐 JWT TOKEN VALIDATION - Verifies token integrity and expiration
	// Responsibility: PURE JTW VALIDATION! NO HTTP KNOWLEDGE!
	if (typeof token !== 'string' || token.trim().length === 0) {
		throw new Error('Invalid JWT: token need to be a non empty string!');
	}

	// Read secret
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error('JWT_SECRET absent in .env file');
	}

	// Verification settings: reject expired tokens to match signJwt policy
	const options = {
		// Lib expects this exact name
		ignoreExpiration: false //Native parameter
	};

	// Verify signature + expiration (will throw on failure)
	const decoded = jwt.verify(token, secret, options);
	//Exemplo:
	/*jwt.sign(
		{ id: 123, role: "ADMIN" }, // ← payload customizado
		secret,
		{ expiresIn: "1d", jwtid: "abc123" } // ← opções que geram exp, iat, jti
	)*/

	// Extract meta claims (standard fields)
	//jti, iat and exp are native JWT params defined from RFC 7519
	//JIT = identificado unico do token
	//iat = Timestamp de quando o token foi emitido
	//exp = Timestamp de quando o token expira
	// SEPARAÇÃO ESTRATÉGICA: Isola dados de negócio (payload) de metadados técnicos (meta)
	// - PAYLOAD: Dados da aplicação (usuário, permissões) → Lógica de negócio
	// - META: Dados do token (jti, iat, exp) → Controle de infraestrutura
	// BENEFÍCIOS:
	// • Clean Architecture (negócio ≠ infraestrutura)
	// • Manutenção isolada (mudar claims JWT não quebra regras de negócio)
	// • Semântica clara (req.user.role vs req.user.exp)
	// • Flexibilidade para evolução (novos claims técnicos não poluem payload)
	const meta = {}; //META → Dados do token em si
	if (decoded && decoded.jti) {
		meta.jti = decoded.jti;
	}
	if (decoded && decoded.iat) {
		meta.iat = decoded.iat;
	}
	if (decoded && decoded.exp) {
		meta.exp = decoded.exp;
	} //OBJ: const meta = { jti, iat, exp }

	// Build a clean payload (without std claims)
	const payload = { ...decoded };

	if (payload.iat !== undefined) {
		delete payload.iat;
	}
	if (payload.exp !== undefined) {
		delete payload.exp;
	}
	if (payload.jti !== undefined) {
		delete payload.jti;
	}

	return { payload, meta };
}

/*
	const payload = { ...decoded };

	if (payload.iat !== undefined) {
		delete payload.iat;
	}
	if (payload.exp !== undefined) {
		delete payload.exp;
	}
	if (payload.jti !== undefined) {
		delete payload.jti;
	}

	signJwt → CRIAÇÃO
Não sabe nada sobre verificação
Só gera tokens seguindo regras
Entrega string pronta

verifyJwt → VALIDAÇÃO
Não sabe nada sobre criação
Só verifica tokens existentes
Confia no padrão JWT, não no signJwt
	*/
