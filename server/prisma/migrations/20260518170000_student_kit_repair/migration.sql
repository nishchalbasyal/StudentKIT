-- Student Kit repair migration.
-- Split data is rebuilt because the previous model used app users as members,
-- while the repaired product model supports named split members.

DO $$ BEGIN
  CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Company"
  ADD COLUMN IF NOT EXISTS "defaultHourlyWage" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "defaultBreakMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "defaultBonusType" "BonusType" NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "defaultBonusValue" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "color" TEXT,
  ADD COLUMN IF NOT EXISTS "commonStartTime" TIME(0),
  ADD COLUMN IF NOT EXISTS "commonEndTime" TIME(0),
  ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "calendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "calendarEventId" TEXT;

DROP TABLE IF EXISTS "SplitExpenseShare" CASCADE;
DROP TABLE IF EXISTS "SplitSettlement" CASCADE;
DROP TABLE IF EXISTS "SplitExpense" CASCADE;
DROP TABLE IF EXISTS "SplitMember" CASCADE;
DROP TABLE IF EXISTS "SplitGroup" CASCADE;

CREATE TABLE "SplitGroup" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SplitGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitMember" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "isCurrentUser" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SplitMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitExpense" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "paidByMemberId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "date" DATE NOT NULL,
  "splitType" "SplitType" NOT NULL DEFAULT 'EQUAL',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SplitExpense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitExpenseShare" (
  "id" TEXT NOT NULL,
  "splitExpenseId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SplitExpenseShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitSettlement" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "fromMemberId" TEXT NOT NULL,
  "toMemberId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "date" DATE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SplitSettlement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SplitGroup_userId_idx" ON "SplitGroup"("userId");
CREATE INDEX "SplitMember_groupId_idx" ON "SplitMember"("groupId");
CREATE INDEX "SplitExpense_groupId_idx" ON "SplitExpense"("groupId");
CREATE INDEX "SplitExpense_paidByMemberId_idx" ON "SplitExpense"("paidByMemberId");
CREATE INDEX "SplitExpense_date_idx" ON "SplitExpense"("date");
CREATE INDEX "SplitExpenseShare_splitExpenseId_idx" ON "SplitExpenseShare"("splitExpenseId");
CREATE INDEX "SplitExpenseShare_memberId_idx" ON "SplitExpenseShare"("memberId");
CREATE UNIQUE INDEX "SplitExpenseShare_splitExpenseId_memberId_key" ON "SplitExpenseShare"("splitExpenseId", "memberId");
CREATE INDEX "SplitSettlement_groupId_idx" ON "SplitSettlement"("groupId");
CREATE INDEX "SplitSettlement_fromMemberId_idx" ON "SplitSettlement"("fromMemberId");
CREATE INDEX "SplitSettlement_toMemberId_idx" ON "SplitSettlement"("toMemberId");
CREATE INDEX "SplitSettlement_date_idx" ON "SplitSettlement"("date");

ALTER TABLE "SplitGroup" ADD CONSTRAINT "SplitGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitMember" ADD CONSTRAINT "SplitMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_paidByMemberId_fkey" FOREIGN KEY ("paidByMemberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitExpenseShare" ADD CONSTRAINT "SplitExpenseShare_splitExpenseId_fkey" FOREIGN KEY ("splitExpenseId") REFERENCES "SplitExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitExpenseShare" ADD CONSTRAINT "SplitExpenseShare_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "SplitMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "code" TEXT,
  "discount" TEXT NOT NULL,
  "description" TEXT,
  "terms" TEXT,
  "url" TEXT,
  "expiresAt" TIMESTAMP(3),
  "source" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "location" TEXT,
  "organizer" TEXT,
  "url" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Coupon_isActive_idx" ON "Coupon"("isActive");
CREATE INDEX IF NOT EXISTS "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");
CREATE INDEX IF NOT EXISTS "Event_isActive_startsAt_idx" ON "Event"("isActive", "startsAt");
