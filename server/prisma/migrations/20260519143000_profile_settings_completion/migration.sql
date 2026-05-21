-- Profile identity fields
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "university" TEXT;
ALTER TABLE "User" ADD COLUMN "course" TEXT;

-- App behavior and preference settings
CREATE TABLE "UserSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
  "emailUpdates" BOOLEAN NOT NULL DEFAULT false,
  "notifyClasses" BOOLEAN NOT NULL DEFAULT true,
  "notifyTasks" BOOLEAN NOT NULL DEFAULT true,
  "notifyWork" BOOLEAN NOT NULL DEFAULT true,
  "notifyGroceries" BOOLEAN NOT NULL DEFAULT true,
  "notifyCleaning" BOOLEAN NOT NULL DEFAULT true,
  "notifySplitSettlements" BOOLEAN NOT NULL DEFAULT true,
  "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
  "language" TEXT NOT NULL DEFAULT 'en',
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "dateFormat" TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
  "timeFormat" TEXT NOT NULL DEFAULT '24H',
  "aiSuggestionsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "aiProviderStatus" TEXT NOT NULL DEFAULT 'READY',
  "aiFormSuggestionsAllowed" BOOLEAN NOT NULL DEFAULT true,
  "aiSuggestionsCacheClearedAt" TIMESTAMP(3),
  "workCountry" TEXT NOT NULL DEFAULT 'DE',
  "yearlyWorkLimitDays" INTEGER NOT NULL DEFAULT 140,
  "defaultHourlyWage" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

ALTER TABLE "UserSettings"
  ADD CONSTRAINT "UserSettings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
