/*
  Warnings:

  - Added the required column `cashbackAmount` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "cashbackAmount" DECIMAL(10,2) NOT NULL;
