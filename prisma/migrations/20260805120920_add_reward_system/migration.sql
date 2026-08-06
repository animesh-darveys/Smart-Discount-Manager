/*
  Warnings:

  - A unique constraint covering the columns `[shop,orderId]` on the table `Reward` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deliveredAt` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Reward_orderId_key";

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "deliveredAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Reward_shop_orderId_key" ON "Reward"("shop", "orderId");
