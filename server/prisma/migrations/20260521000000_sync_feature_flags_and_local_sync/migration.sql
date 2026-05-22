-- Create enums used by the expanded sync and budgeting model
DO $$ BEGIN
  CREATE TYPE "BudgetType" AS ENUM ('WEEKLY', 'MONTHLY', 'CATEGORY', 'SAVINGS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AIAccessPlan" AS ENUM ('FREE', 'PLUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User settings module preference storage
ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "selectedModules" JSONB;

-- Budget model expansion
ALTER TABLE "Budget"
  ADD COLUMN IF NOT EXISTS "localId" TEXT NOT NULL DEFAULT concat('budget_', substring(md5(random()::text || clock_timestamp()::text), 1, 16)),
  ADD COLUMN IF NOT EXISTS "type" "BudgetType" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "amountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "periodEnd" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Budget_localId_idx" ON "Budget"("localId");
CREATE INDEX IF NOT EXISTS "Budget_periodStart_idx" ON "Budget"("periodStart");
CREATE INDEX IF NOT EXISTS "Budget_periodEnd_idx" ON "Budget"("periodEnd");

-- Reminder model expansion
ALTER TABLE "Reminder"
  ADD COLUMN IF NOT EXISTS "localId" TEXT NOT NULL DEFAULT concat('reminder_', substring(md5(random()::text || clock_timestamp()::text), 1, 16)),
  ADD COLUMN IF NOT EXISTS "sourceType" "LinkedEntityType",
  ADD COLUMN IF NOT EXISTS "sourceId" TEXT,
  ADD COLUMN IF NOT EXISTS "repeatRule" TEXT,
  ADD COLUMN IF NOT EXISTS "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "deliveryType" TEXT NOT NULL DEFAULT 'IN_APP',
  ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Reminder_localId_idx" ON "Reminder"("localId");

-- AI access model
CREATE TABLE IF NOT EXISTS "AIAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" "AIAccessPlan" NOT NULL DEFAULT 'FREE',
  "monthlyLimit" INTEGER NOT NULL DEFAULT 0,
  "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
  "resetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIAccess_userId_key" ON "AIAccess"("userId");
ALTER TABLE "AIAccess"
  ADD CONSTRAINT "AIAccess_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
