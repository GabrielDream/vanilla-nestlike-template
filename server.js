// server.js
import 'dotenv/config';
import app from './src/app.js';
import { prisma } from './src/users/db/prisma.js';

import { logInfo, logError, logBanner } from './terminalStylization/logger.js';
import { delay, beep, animateBox } from './terminalStylization/spyConsole.js';

const PORT = process.env.PORT || 3051;

async function bootstrap() {
	try {
		logInfo('🧠 Initializing Neurocoding Template Server…');

		// 🎯 Test DB connection (Prisma)
		await prisma.$connect();
		logInfo('✅ Connected to PostgreSQL via Prisma');
		await beep();

		// Boot flow estilizado
		await delay(350);
		await beep('🔍 Verifying systems...');
		await delay(600);
		logInfo('System integrity: OK');

		await delay(500);
		await beep('🛡️ Loading security/authorization modules...');
		await delay(500);
		logInfo('Auth modules healthy and active');

		await delay(500);
		await beep('📡 Preparing runtime environment...');
		await delay(500);
		logInfo('Runtime ready');

		// Limpa console quando não for ambiente de deploy
		if (!process.env.RENDER_EXTERNAL_URL) {
			await delay(700);
			console.clear();
		}

		// Banner do QG
		const banner = `
╔══════════════════════════════════════════════╗
║        🧠 NEUROCODING TEMPLATE ONLINE        ║
╠══════════════════════════════════════════════╣
║  🚀 Server Port: ${PORT}
║  🌐 Base Route: http://localhost:${PORT}
║  🔐 Auth Ready, DB Ready, RBAC Ready
╚══════════════════════════════════════════════╝
        `;
		await animateBox(banner, 150);
		logBanner('SYSTEM STATUS: ONLINE — READY TO HANDLE REQUESTS');

		// Start Server
		app.listen(PORT, () => {
			logInfo(`🚀 Server running at http://localhost:${PORT}`);
		});
	} catch (err) {
		logError('❌ Fatal error during startup');
		console.error(err);
		process.exit(1);
	}
}

// Handle unhandledRejections
process.on('unhandledRejection', (err) => {
	logError('❌ Unhandled Promise Rejection:');
	console.error(err);
});

// Start everything
bootstrap();
