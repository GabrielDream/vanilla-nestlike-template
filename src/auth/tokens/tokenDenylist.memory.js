// ==================================================
// SIMPLE IN-MEMORY DENYLIST FOR JWTs (KEYED BY JTI)
// ==================================================
// Objetivo: revogar tokens JWT até sua expiração natural.
// Uso: no endpoint /logout para invalidar tokens antes do exp.
// Observação: implementação em memória (volátil).
// Em produção com múltiplos servidores, use Redis ou DB.
// ==================================================

// 🗃️ PASSO 1: STORE PRINCIPAL - Onde os tokens revogados ficam
// ==================================================
// Map vs Object: Map é melhor porque:
// - Chaves podem ser qualquer tipo (jtis são strings)
// - Performance O(1) para operações .has() frequentes
// - Mantém ordem de inserção (não crucial, mas útil)
const store = new Map();

// ⏰ PASSO 2: MAP DE TIMERS - Para gerenciar limpeza automática
// ==================================================
// Por que separar os timers?
// - Evita memory leaks (timers órfãos)
// - Cancela timers antigos em revogações múltiplas
// - Facilita cleanup completo nos testes
const timers = new Map();

// 🛡️ PASSO 3: LIMITE DE SEGURANÇA PARA setTimeout
// ==================================================
// setTimeout tem limite máximo de ~24.8 dias (2^31-1 ms)
// TTLs maiores causariam overflow e executariam IMEDIATAMENTE
const MAX_DELAY_MS = 0x7fffffff; // 2,147,483,647 ms

export const tokenDenylist = {
	// ==================================================
	// ✅ VERIFICA SE UM TOKEN ESTÁ REVOGADO
	// ==================================================
	// USO: no middleware de autenticação antes de aceitar token
	// EXEMPLO: if (await tokenDenylist.isRevoked(decoded.jti)) blockAccess()
	// PERFORMANCE: Map.has() é O(1)
	isRevoked: async function (jti) {
		return store.has(jti);
	},

	// ==================================================
	// 🔐 REVOGA UM TOKEN ATÉ SUA EXPIRAÇÃO NATURAL
	// ==================================================
	// FLUXO:
	// 1. Valida entrada
	// 2. Adiciona à lista negra (imediato)
	// 3. Cancela timer anterior (se existir)
	// 4. Agenda remoção automática (quando expirar)
	// 5. Libera timer para não travar shutdown
	revoke: async function (jti, remainingLifetimeSec) {
		// 🚨 VALIDAÇÃO CRÍTICA
		if (
			typeof remainingLifetimeSec !== 'number' ||
			!Number.isFinite(remainingLifetimeSec) ||
			remainingLifetimeSec <= 0
		) {
			throw new Error('remainingLifetimeSec must be a positive number (seconds). Received: ' + remainingLifetimeSec);
		}

		// ⏱️ NORMALIZAÇÃO DO TEMPO
		const seconds = Math.max(1, Math.floor(remainingLifetimeSec));

		// ✅ REVOGAÇÃO IMEDIATA
		store.set(jti, true);

		// 🔄 CANCELA TIMER ANTIGO (se existir)
		const oldTimer = timers.get(jti);
		if (oldTimer) clearTimeout(oldTimer);

		// 🗑️ AGENDAMENTO DE LIMPEZA (expiração natural)
		let delay = seconds * 1000;
		if (delay > MAX_DELAY_MS) delay = MAX_DELAY_MS;

		const t = setTimeout(function () {
			store.delete(jti);
			timers.delete(jti);
		}, delay);

		// 🔧 PERMITE SHUTDOWN LIMPO (Jest/Node)
		if (t && typeof t.unref === 'function') {
			t.unref();
		}

		// 💾 ARMAZENA TIMER PARA GERENCIAMENTO FUTURO
		timers.set(jti, t);
	},

	// ==================================================
	// 🧪 HELPER PARA TESTES - LIMPEZA COMPLETA
	// ==================================================
	// USO: afterEach(async () => await tokenDenylist._clear())
	// IMPORTANTE: método interno (não usar em produção)
	_clear: async function () {
		// 1. 🧹 CANCELA TODOS OS TIMERS
		for (const t of timers.values()) clearTimeout(t);
		timers.clear();

		// 2. 🗑️ LIMPA TOKENS REVOGADOS
		store.clear();
	},
};
