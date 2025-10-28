/**
 * Jest Global Setup — resets the dedicated test database.
 *
 * What this script does:
 * 1) Loads `.env.test` to read the test-only DATABASE_URL and NODE_ENV.
 * 2) Safety guard: aborts if NODE_ENV !== "test" (prevents destructive resets in dev/prod).
 * 3) Runs `prisma generate` to ensure the Prisma Client matches your schema.
 * 4) Runs `prisma db push --force-reset --skip-generate` to drop and recreate the schema on the test database.
 *
 * Why: Each test run starts from a clean, deterministic database state—no data leakage between tests.
 *
 * Safety: It only touches the test database because it reads DATABASE_URL from `.env.test`,
 * and the NODE_ENV guard prevents accidental execution against non-test environments.
 */

const { execSync } = require('node:child_process');
const dotenv = require('dotenv');

module.exports = async () => {
	// carrega .env.test AQUI também, pq o globalSetup roda antes do setupFiles
	dotenv.config({ path: '.env.test' });

	//Valida se NODE_ENV realmente é "test" (proteção contra apagar banco errado):
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('Abort: refusing to reset DB outside NODE_ENV=test');
	}

	//CLI:
	execSync('npx prisma generate', { stdio: 'inherit' }); //generate prisma client
	execSync('npx prisma db push --force-reset --skip-generate', { stdio: 'inherit' }); //delete and recriate db's schema
};

/*Roda antes de todos os testes, e:=
Recarrega o .env.test (porque é executado antes dos setupFiles).
Valida se NODE_ENV realmente é "test" (proteção contra apagar banco errado).
Executa npx prisma generate → garante que o client Prisma está atualizado.
Executa npx prisma db push --force-reset --skip-generate → apaga e recria o schema do banco de testes.
👉 É o “resetador” que limpa e sincroniza o banco a cada rodada.*/
