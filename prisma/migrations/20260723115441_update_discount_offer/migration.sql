/*
  Warnings:

  - You are about to drop the column `bannerImage` on the `DiscountOffer` table. All the data in the column will be lost.
  - You are about to drop the column `collections` on the `DiscountOffer` table. All the data in the column will be lost.
  - You are about to drop the column `perCustomerLimit` on the `DiscountOffer` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `DiscountOffer` table. All the data in the column will be lost.
  - You are about to drop the column `products` on the `DiscountOffer` table. All the data in the column will be lost.
  - The `customerTags` column on the `DiscountOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `appliesTo` to the `DiscountOffer` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerEligibility` on table `DiscountOffer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DiscountOffer" DROP COLUMN "bannerImage",
DROP COLUMN "collections",
DROP COLUMN "perCustomerLimit",
DROP COLUMN "priority",
DROP COLUMN "products",
ADD COLUMN     "appliesTo" TEXT NOT NULL,
ADD COLUMN     "customerIds" JSONB,
ADD COLUMN     "limitPerCustomer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selectedCollections" JSONB,
ADD COLUMN     "selectedProducts" JSONB,
ALTER COLUMN "customerEligibility" SET NOT NULL,
DROP COLUMN "customerTags",
ADD COLUMN     "customerTags" JSONB,
ALTER COLUMN "status" SET DEFAULT 'active';
