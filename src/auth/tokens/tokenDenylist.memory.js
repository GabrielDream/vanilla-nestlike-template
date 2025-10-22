// Simple in-memory denylist for JWTs (keyed by jti).
// Use in /logout to revoke the current token until it naturally expires.

const store = new Map();

export const tokenDenylist = {
	// Returns true if the given jti is currently revoked
	async isRevoked(jti) {
		return store.has(jti);
	},

	// Marks a jti as revoked for ttlSec seconds (usually: token.exp - nowInSeconds)
	async revoke(jti, ttlSec) {
		let seconds = 1; // safety floor
		if (typeof ttlSec === 'number' && Number.isFinite(ttlSec)) {
			const s = Math.floor(ttlSec);
			if (s > 0) seconds = s;
		}

		store.set(jti, 1);
		const t = setTimeout(function () {
			store.delete(jti);
		}, seconds * 1000);

		// Allow process to exit even if this timer is pending (fixes Jest warning)
		if (typeof t?.unref === 'function') t.unref();
	},

	// Test helper: clears the in-memory store
	async _clear() {
		store.clear();
	},
};
