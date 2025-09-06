-- Se existir índice único antigo, remova para evitar conflito
DROP INDEX IF EXISTS "User_email_key";

-- Backfill: garante que todos emails já estejam em lowercase
UPDATE "User" SET "email" = LOWER("email");

-- Constraint: só aceita lowercase daqui pra frente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_email_lower_only_chk'
  ) THEN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_email_lower_only_chk"
    CHECK ("email" = LOWER("email"));
  END IF;
END $$;

-- Índice único funcional: garante unicidade case-insensitive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'User_email_ci_key'
  ) THEN
    CREATE UNIQUE INDEX "User_email_ci_key" ON "User"(LOWER("email"));
  END IF;
END $$;
-- This is an empty migration.
