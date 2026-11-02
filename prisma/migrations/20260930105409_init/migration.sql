-- CreateEnum
CREATE TYPE "DiscountSource" AS ENUM ('MANUAL', 'AUTO_REWARD');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountOffer" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "shopifyDiscountId" TEXT,
    "discountCode" TEXT NOT NULL,
    "source" "DiscountSource" NOT NULL DEFAULT 'MANUAL',
    "discountCategory" TEXT NOT NULL DEFAULT 'ORDER',
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minimumPurchase" DOUBLE PRECISION,
    "appliesTo" TEXT NOT NULL,
    "selectedProducts" JSONB,
    "selectedCollections" JSONB,
    "customerEligibility" TEXT NOT NULL,
    "customerIds" JSONB,
    "limitPerCustomer" BOOLEAN NOT NULL DEFAULT false,
    "usageLimit" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "orderId" TEXT,
    "orderName" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "cashbackAmount" DOUBLE PRECISION,
    "deliveredAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountOffer_shopifyDiscountId_key" ON "DiscountOffer"("shopifyDiscountId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountOffer_discountCode_key" ON "DiscountOffer"("discountCode");

-- CreateIndex
CREATE INDEX "DiscountOffer_shop_idx" ON "DiscountOffer"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountOffer_shop_orderId_key" ON "DiscountOffer"("shop", "orderId");
