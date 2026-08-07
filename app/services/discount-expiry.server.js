import prisma from "../db.server";
import { deactivateShopifyDiscount } from "./shopify-discount.server";

export async function expireDiscounts(admin, shop) {
  const now = new Date();

  // Find all active discounts whose end date has passed
  const discounts = await prisma.discountOffer.findMany({
    where: {
      shop,
      status: "active",
      endDate: {
        not: null,
        lte: now,
      },
    },
  });

  console.log(
    `[Discount Expiry] Found ${discounts.length} expired discount(s)`
  );

  let success = 0;
  let failed = 0;

  for (const discount of discounts) {
    try {
      console.log(
        `[Discount Expiry] Expiring ${discount.discountCode}`
      );

      // Deactivate Shopify discount
      if (discount.shopifyDiscountId) {
        await deactivateShopifyDiscount(
          admin,
          discount.shopifyDiscountId
        );
      }

      // Update database
      await prisma.discountOffer.update({
        where: {
          id: discount.id,
        },
        data: {
          status: "expired",
        },
      });

      success++;
    } catch (error) {
      failed++;

      console.error(
        `[Discount Expiry] Failed for ${discount.discountCode}`,
        error
      );
    }
  }

  return {
    total: discounts.length,
    success,
    failed,
  };
}