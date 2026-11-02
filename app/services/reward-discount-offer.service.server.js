import prisma from "../db.server";

export async function createDiscountOffer(
  shop,
  discountData,
  coupon
) {
  // Same dates as the Shopify discount.
  const startDate = new Date(coupon.startDate);
  const endDate = new Date(coupon.endDate);

  const discountOffer = await prisma.discountOffer.create({
    data: {
      shop,

      title: `Cashback Reward - ${discountData.orderName}`,

      description:
        "Auto-generated cashback reward",

      // Order information
      orderId: discountData.orderId,
      orderName: discountData.orderName,

      // Customer information
      customerId: discountData.customerId,
      customerName: discountData.customerName,
      customerEmail: discountData.customerEmail,

      // Cashback information
      cashbackAmount: Number(
        discountData.cashbackAmount
      ),

      deliveredAt: discountData.deliveredAt,

      generatedAt: new Date(),

      // Shopify discount information
      discountCode: coupon.discountCode,

      discountCategory: "order",

      discountType: "FIXED_AMOUNT",

      discountValue: Number(
        discountData.cashbackAmount
      ),

      appliesTo: "all",

      customerEligibility:
        "specific_customers",

      customerIds: [discountData.customerId],

      startDate,

      endDate,

      usageLimit: 1,

      limitPerCustomer: true,

      status: "active",

      source: "AUTO_REWARD",

      shopifyDiscountId:
        coupon.shopifyDiscountId,
    },
  });

  return discountOffer;
}