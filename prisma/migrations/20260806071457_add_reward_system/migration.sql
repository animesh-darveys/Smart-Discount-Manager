/*
  Warnings:

  - A unique constraint covering the columns `[shopifyDiscountId]` on the table `DiscountOffer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DiscountOffer_shopifyDiscountId_key" ON "DiscountOffer"("shopifyDiscountId");
