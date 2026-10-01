-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: rename instead of drop+add so existing MainBill uniqueness carries over
ALTER TABLE "MainBill" ADD COLUMN     "userId" TEXT;
DROP INDEX "MainBill_month_year_key";
CREATE UNIQUE INDEX "MainBill_userId_month_year_key" ON "MainBill"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "MainBill" ADD CONSTRAINT "MainBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: rename instead of drop+add so existing tenant numbers survive
ALTER TABLE "Meter" RENAME COLUMN "meterNumber" TO "whatsappNumber";
