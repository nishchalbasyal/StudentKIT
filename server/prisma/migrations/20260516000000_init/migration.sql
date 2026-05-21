-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('INTERNATIONAL', 'EU_EEA_SWISS', 'GERMAN', 'OTHER');

-- CreateEnum
CREATE TYPE "BonusType" AS ENUM ('NONE', 'DOUBLE', 'PERCENTAGE', 'FIXED', 'NIGHT_SHIFT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('GROCERIES', 'RENT', 'TRANSPORT', 'FOOD', 'STUDY', 'HEALTH', 'ENTERTAINMENT', 'BILLS', 'SHOPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'PAYPAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('MANDATORY', 'OPTIONAL', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('HOMEWORK', 'ASSIGNMENT', 'EXAM', 'PERSONAL', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShoppingStatus" AS ENUM ('PENDING', 'BOUGHT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('CLASS', 'TASK', 'GROCERY', 'CLEANING', 'WORK', 'EXPENSE', 'AI', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LinkedEntityType" AS ENUM ('CLASS', 'TASK', 'GROCERY_ITEM', 'GROCERY_PURCHASE', 'SHOPPING_LIST_ITEM', 'CLEANING_TASK', 'WORK_SHIFT', 'EXPENSE', 'BUDGET', 'AI_INSIGHT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AIInsightType" AS ENUM ('EXPENSE_ADVICE', 'WEEKLY_SUMMARY', 'GROCERY_ADVICE', 'STUDY_PLAN', 'WORK_LIMIT_WARNING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'DE',
    "studentStatus" "StudentStatus" NOT NULL DEFAULT 'INTERNATIONAL',
    "hourlyWageDefault" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkLimitPolicy" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "studentStatus" "StudentStatus" NOT NULL,
    "yearlyFullDayLimit" INTEGER NOT NULL DEFAULT 140,
    "yearlyHalfDayLimit" INTEGER NOT NULL DEFAULT 280,
    "halfDayMaxHours" DECIMAL(5,2) NOT NULL DEFAULT 4.0,
    "weeklyLectureLimit" DECIMAL(5,2),
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkLimitPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkShift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "hourlyWage" DECIMAL(10,2) NOT NULL,
    "bonusType" "BonusType" NOT NULL DEFAULT 'NONE',
    "bonusValue" DECIMAL(10,2),
    "isPublicHoliday" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "date" DATE NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "category" "ExpenseCategory",
    "amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "professorName" TEXT,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "location" TEXT,
    "attendanceType" "AttendanceType" NOT NULL DEFAULT 'FLEXIBLE',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "reminderMinutesBefore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'OTHER',
    "dueDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "reminderAt" TIMESTAMP(3),
    "linkedClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroceryItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "defaultQuantity" TEXT,
    "estimatedDaysLasts" INTEGER,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroceryPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "storeName" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" TEXT NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "expectedFinishDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GroceryPurchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "status" "ShoppingStatus" NOT NULL DEFAULT 'PENDING',
    "reminderDate" DATE,
    "boughtAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CleaningTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "lastCompletedAt" TIMESTAMP(3),
    "nextReminderAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CleaningTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" "ReminderType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "linkedEntityType" "LinkedEntityType",
    "linkedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AIInsightType" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "promptHash" TEXT,
    "inputSummary" JSONB NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_country_studentStatus_idx" ON "User"("country", "studentStatus");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");
CREATE INDEX "WorkLimitPolicy_countryCode_studentStatus_effectiveFrom_idx" ON "WorkLimitPolicy"("countryCode", "studentStatus", "effectiveFrom");
CREATE INDEX "WorkShift_userId_idx" ON "WorkShift"("userId");
CREATE INDEX "WorkShift_userId_date_idx" ON "WorkShift"("userId", "date");
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");
CREATE INDEX "Expense_userId_category_idx" ON "Expense"("userId", "category");
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX "Budget_userId_year_month_idx" ON "Budget"("userId", "year", "month");
CREATE UNIQUE INDEX "Budget_userId_year_month_category_key" ON "Budget"("userId", "year", "month", "category");
CREATE INDEX "ClassSchedule_userId_idx" ON "ClassSchedule"("userId");
CREATE INDEX "ClassSchedule_userId_dayOfWeek_idx" ON "ClassSchedule"("userId", "dayOfWeek");
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");
CREATE INDEX "Task_linkedClassId_idx" ON "Task"("linkedClassId");
CREATE INDEX "GroceryItem_userId_idx" ON "GroceryItem"("userId");
CREATE INDEX "GroceryItem_userId_name_idx" ON "GroceryItem"("userId", "name");
CREATE INDEX "GroceryPurchase_userId_idx" ON "GroceryPurchase"("userId");
CREATE INDEX "GroceryPurchase_groceryItemId_idx" ON "GroceryPurchase"("groceryItemId");
CREATE INDEX "GroceryPurchase_userId_purchaseDate_idx" ON "GroceryPurchase"("userId", "purchaseDate");
CREATE INDEX "ShoppingListItem_userId_idx" ON "ShoppingListItem"("userId");
CREATE INDEX "ShoppingListItem_userId_status_idx" ON "ShoppingListItem"("userId", "status");
CREATE INDEX "ShoppingListItem_groceryItemId_idx" ON "ShoppingListItem"("groceryItemId");
CREATE INDEX "CleaningTask_userId_idx" ON "CleaningTask"("userId");
CREATE INDEX "CleaningTask_userId_nextReminderAt_idx" ON "CleaningTask"("userId", "nextReminderAt");
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");
CREATE INDEX "Reminder_userId_scheduledAt_idx" ON "Reminder"("userId", "scheduledAt");
CREATE INDEX "Reminder_userId_isCompleted_idx" ON "Reminder"("userId", "isCompleted");
CREATE INDEX "Reminder_linkedEntityType_linkedEntityId_idx" ON "Reminder"("linkedEntityType", "linkedEntityId");
CREATE INDEX "AIInsight_userId_idx" ON "AIInsight"("userId");
CREATE INDEX "AIInsight_userId_type_idx" ON "AIInsight"("userId", "type");
CREATE INDEX "AIInsight_createdAt_idx" ON "AIInsight"("createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_linkedClassId_fkey" FOREIGN KEY ("linkedClassId") REFERENCES "ClassSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroceryItem" ADD CONSTRAINT "GroceryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryPurchase" ADD CONSTRAINT "GroceryPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroceryPurchase" ADD CONSTRAINT "GroceryPurchase_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

