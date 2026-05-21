/*
  Warnings:

  - A unique constraint covering the columns `[userId,year,week,category]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "week" INTEGER;

-- AlterTable
ALTER TABLE "WorkShift" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitGroup" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitExpense" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "paidByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitExpenseShare" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitExpenseShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitSettlement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT DEFAULT 'Cash settlement',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_userId_idx" ON "Company"("userId");

-- CreateIndex
CREATE INDEX "Company_userId_name_idx" ON "Company"("userId", "name");

-- CreateIndex
CREATE INDEX "SplitGroup_creatorId_idx" ON "SplitGroup"("creatorId");

-- CreateIndex
CREATE INDEX "SplitMember_groupId_idx" ON "SplitMember"("groupId");

-- CreateIndex
CREATE INDEX "SplitMember_userId_idx" ON "SplitMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitMember_groupId_userId_key" ON "SplitMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "SplitExpense_groupId_idx" ON "SplitExpense"("groupId");

-- CreateIndex
CREATE INDEX "SplitExpense_paidByUserId_idx" ON "SplitExpense"("paidByUserId");

-- CreateIndex
CREATE INDEX "SplitExpense_date_idx" ON "SplitExpense"("date");

-- CreateIndex
CREATE INDEX "SplitExpenseShare_expenseId_idx" ON "SplitExpenseShare"("expenseId");

-- CreateIndex
CREATE INDEX "SplitExpenseShare_userId_idx" ON "SplitExpenseShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitExpenseShare_expenseId_userId_key" ON "SplitExpenseShare"("expenseId", "userId");

-- CreateIndex
CREATE INDEX "SplitSettlement_groupId_idx" ON "SplitSettlement"("groupId");

-- CreateIndex
CREATE INDEX "SplitSettlement_fromUserId_idx" ON "SplitSettlement"("fromUserId");

-- CreateIndex
CREATE INDEX "SplitSettlement_toUserId_idx" ON "SplitSettlement"("toUserId");

-- CreateIndex
CREATE INDEX "SplitSettlement_settledAt_idx" ON "SplitSettlement"("settledAt");

-- CreateIndex
CREATE INDEX "Budget_userId_year_week_idx" ON "Budget"("userId", "year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_year_week_category_key" ON "Budget"("userId", "year", "week", "category");

-- CreateIndex
CREATE INDEX "WorkShift_companyId_idx" ON "WorkShift"("companyId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShift" ADD CONSTRAINT "WorkShift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitGroup" ADD CONSTRAINT "SplitGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitMember" ADD CONSTRAINT "SplitMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitMember" ADD CONSTRAINT "SplitMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitExpense" ADD CONSTRAINT "SplitExpense_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitExpenseShare" ADD CONSTRAINT "SplitExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "SplitExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitExpenseShare" ADD CONSTRAINT "SplitExpenseShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SplitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
