/*
  Warnings:

  - Added the required column `orderName` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "orderName" TEXT NOT NULL;
