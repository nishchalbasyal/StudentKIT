-- CreateEnum
CREATE TYPE "WorkLimitType" AS ENUM ('UNLIMITED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WorkLimitUnit" AS ENUM ('HOURS', 'DAYS');

-- CreateEnum
CREATE TYPE "WorkLimitPeriodUnit" AS ENUM ('WEEK', 'MONTH', 'YEAR', 'CUSTOM_DAYS');

-- CreateTable
CREATE TABLE "WorkLimitSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "limitType" "WorkLimitType" NOT NULL DEFAULT 'UNLIMITED',
    "limitValue" DECIMAL(10,2),
    "limitUnit" "WorkLimitUnit",
    "periodValue" INTEGER,
    "periodUnit" "WorkLimitPeriodUnit",
    "warningPercentage" INTEGER NOT NULL DEFAULT 80,
    "dangerPercentage" INTEGER NOT NULL DEFAULT 95,
    "hasDismissedUnlimitedLimitBanner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLimitSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkLimitSettings_userId_key" ON "WorkLimitSettings"("userId");

-- CreateIndex
CREATE INDEX "WorkLimitSettings_userId_idx" ON "WorkLimitSettings"("userId");

-- AddForeignKey
ALTER TABLE "WorkLimitSettings" ADD CONSTRAINT "WorkLimitSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;