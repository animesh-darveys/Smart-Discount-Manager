/*
  Warnings:

  - You are about to drop the column `customerTags` on the `DiscountOffer` table. All the data in the column will be lost.
  - You are about to drop the column `maximumDiscount` on the `DiscountOffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DiscountOffer" DROP COLUMN "customerTags",
DROP COLUMN "maximumDiscount";
