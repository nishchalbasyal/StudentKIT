-- Splitwise completion: registered/manual members, cent-safe balances,
-- payer records, group archive metadata, and activity tracking.

ALTER TABLE "SplitGroup"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "SplitMember"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "isRegisteredUser" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'MEMBER';

UPDATE "SplitMember" sm
SET
  "userId" = u."id",
  "isRegisteredUser" = true
FROM "SplitGroup" sg
JOIN "User" u ON u."id" = sg."userId"
WHERE sm."groupId" = sg."id"
  AND sm."isCurrentUser" = true
  AND sm."userId" IS NULL;

ALTER TABLE "SplitExpense"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "amountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

UPDATE "SplitExpense" se
SET
  "amountCents" = ROUND((se."amount" * 100))::INTEGER,
  "currency" = sg."currency",
  "createdByUserId" = sg."userId"
FROM "SplitGroup" sg
WHERE se."groupId" = sg."id"
  AND se."amountCents" = 0;

ALTER TABLE "SplitExpenseShare"
  ADD COLUMN IF NOT EXISTS "amountCents" INTEGER NOT NULL DEFAULT 0;

UPDATE "SplitExpenseShare"
SET "amountCents" = ROUND(("amount" * 100))::INTEGER
WHERE "amountCents" = 0;

CREATE TABLE IF NOT EXISTS "SplitExpensePayer" (
  "id" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SplitExpensePayer_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SplitExpensePayer" ("id", "expenseId", "memberId", "amountCents", "createdAt")
SELECT
  'payer_' || se."id",
  se."id",
  se."paidByMemberId",
  se."amountCents",
  se."createdAt"
FROM "SplitExpense" se
WHERE NOT EXISTS (
  SELECT 1 FROM "SplitExpensePayer" sep WHERE sep."expenseId" = se."id" AND sep."memberId" = se."paidByMemberId"
);

ALTER TABLE "SplitSettlement"
  ADD COLUMN IF NOT EXISTS "amountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;

UPDATE "SplitSettlement" ss
SET
  "amountCents" = ROUND((ss."amount" * 100))::INTEGER,
  "currency" = sg."currency",
  "createdByUserId" = sg."userId"
FROM "SplitGroup" sg
WHERE ss."groupId" = sg."id"
  AND ss."amountCents" = 0;

CREATE TABLE IF NOT EXISTS "SplitActivity" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SplitActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SplitGroup_archivedAt_idx" ON "SplitGroup"("archivedAt");
CREATE INDEX IF NOT EXISTS "SplitMember_userId_idx" ON "SplitMember"("userId");
CREATE INDEX IF NOT EXISTS "SplitMember_groupId_userId_idx" ON "SplitMember"("groupId", "userId");
CREATE INDEX IF NOT EXISTS "SplitExpense_createdByUserId_idx" ON "SplitExpense"("createdByUserId");
CREATE INDEX IF NOT EXISTS "SplitExpensePayer_expenseId_idx" ON "SplitExpensePayer"("expenseId");
CREATE INDEX IF NOT EXISTS "SplitExpensePayer_memberId_idx" ON "SplitExpensePayer"("memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "SplitExpensePayer_expenseId_memberId_key" ON "SplitExpensePayer"("expenseId", "memberId");
CREATE INDEX IF NOT EXISTS "SplitSettlement_createdByUserId_idx" ON "SplitSettlement"("createdByUserId");
CREATE INDEX IF NOT EXISTS "SplitActivity_groupId_idx" ON "SplitActivity"("groupId");
CREATE INDEX IF NOT EXISTS "SplitActivity_createdAt_idx" ON "SplitActivity"("createdAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SplitMember_userId_fkey') THEN
    ALTER TABLE "SplitMember" ADD CONSTRAINT "SplitMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SplitExpense_createdByUserId_fkey') THEN
    ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SplitExpensePayer_expenseId_fkey') THEN
    ALTER TABLE "SplitExpensePayer" ADD CONSTRAINT "SplitExpensePayer_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "SplitExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SplitExpensePayer_memberId_fkey') THEN
    ALTER TABLE "SplitExpensePayer" ADD CONSTRAINT "SplitExpensePayer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SplitSettlement_createdByUserId_fkey') THEN
    ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SplitActivity_groupId_fkey') THEN
    ALTER TABLE "SplitActivity" ADD CONSTRAINT "SplitActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
