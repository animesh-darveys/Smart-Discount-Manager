/*
  Warnings:

  - The `source` column on the `DiscountOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `shop` to the `DiscountOffer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscountOffer" ADD COLUMN     "shop" TEXT NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "DiscountSource" NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX "DiscountOffer_shop_idx" ON "DiscountOffer"("shop");

-- CreateIndex
CREATE INDEX "Reward_shop_idx" ON "Reward"("shop");
