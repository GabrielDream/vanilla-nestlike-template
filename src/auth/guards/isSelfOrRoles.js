import AppError from '../../../middlewares/AppError.js';

/**
 * Allows access if the current user is the target user (req.params.id)
 * OR if the current user's role is in the allowed list.
 * Usage: app.put("/users/:id", authRequired, isSelfOrRoles("admin"), handler)
 */
export default function isSelfOrRoles(...roles) {
	// roles can be empty → "self only" mode.
	// allowRoles need it, cause theres no sense to allow "nothing"
	return function (req, _res, next) {
		// 🆔 FLUXO: Dados vêm de fontes DIFERENTES:
		// - userId: do token JWT (quem ESTÁ autenticado)
		// - userRole: do token JWT (permissão do usuário)
		// - targetId: do parâmetro :id na URL (recurso sendo acessado)
		const userId = req?.user?.id; //SEMPRE OBRIGATÓRIO
		const userRole = req?.user?.role;
		const targetId = req?.params?.id;

		// 🚫 VALIDAÇÃO: Garante que temos os dados necessários
		if (!userId) {
			throw new AppError('Missing user id', 403, 'auth', 'SELF_OR_ROLE_MISSING_USER');
		}

		// ⚠️ FLUXO: targetId DEVE vir da URL CASO isSelfOrRoles for chamado vazio!(ex: /users/123)
		// Se a rota não tem :id, isso FALHA!
		if (typeof targetId !== 'string' || targetId.trim().length === 0) {
			throw new AppError('Missing target id param', 403, 'auth', 'SELF_OR_ROLE_MISSING_TARGET');
		}

		// 🔄 FLUXO: DUAS FORMAS DE ACESSO:
		// 1️⃣ MODO SELF: usuário acessando SEUS próprios dados
		//    - Compara userId (token) vs targetId (URL)
		//    - Se for igual → isSelf = true → ACESSO IMEDIATO
		const isSelf = userId === targetId;

		// 2️⃣ MODO ROLE: usuário com permissões especiais
		//    - Verifica se userRole está na lista de roles permitidas
		//    - Array vazio = modo "self-only" (roleAllowed = false)
		const roleAllowed = roles.length > 0 && roles.includes(userRole);

		// 🎯 FLUXO FINAL: LÓGICA "OU" (OR)
		// - Se NÃO for self E NÃO tiver role → BLOQUEIA
		// - Se for self → IGNORA verificação de roles (✅ PERMITIDO)
		// - Se tiver role → IGNORA verificação de self (✅ PERMITIDO)
		if (!isSelf && !roleAllowed) {
			throw new AppError('Forbidden', 403, 'auth', 'SELF_OR_ROLE_FORBIDDEN');
		}

		// ✅ FLUXO: Acesso permitido → passa para o próximo middleware/handler
		return next(); //Agora é hora das rotas lidarem.
	};
}
