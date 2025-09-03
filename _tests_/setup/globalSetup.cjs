const { execSync } = require("node:child_process");
const dotenv = require("dotenv");

module.exports = async () => {
	// carrega .env.test AQUI também, pq o globalSetup roda antes do setupFiles
	dotenv.config({ path: ".env.test" });

	if (process.env.NODE_ENV !== "test") {
		throw new Error("Abort: refusing to reset DB outside NODE_ENV=test");
	}

	execSync("npx prisma generate", { stdio: "inherit" }); //generate prisma client
	execSync("npx prisma db push --force-reset --skip-generate", { stdio: "inherit" }); //delete and recriate db's schema
};

