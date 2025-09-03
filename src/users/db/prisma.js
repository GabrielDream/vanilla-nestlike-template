//Singleton = a pattern that ensures there is only one instance of something in the entire process.

// src/db/prisma.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis; // global reference to avoid duplication in dev mode

// If it already exists, reuse it; otherwise, create a new instance
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"], // in dev you may use ["query", "warn", "error"]
  });

// In dev mode, store it on globalThis (hot reload won't recreate the pool)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

