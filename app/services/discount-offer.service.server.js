import prisma from "../db.server";

export async function createDiscountOffer(
  shop,
  reward,
  coupon
) {
  const startDate = new Date();

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 60);

  const discountOffer =
    await prisma.discountOffer.create({
      data: {
        shop,

        title: `Cashback Reward - ${reward.orderName}`,

        description:
          "Auto-generated cashback reward",

        discountCode: coupon.discountCode,

        discountCategory: "ORDER",

        discountType: "FIXED_AMOUNT",

        discountValue: Number(
          reward.cashbackAmount
        ),

        appliesTo: "all",

        customerEligibility:
          "specific_customers",

        customerIds: [reward.customerId],

        startDate,

        endDate,

        usageLimit: 1,

        limitPerCustomer: true,

        status: "active",

        source: "AUTO_REWARD",

        shopifyDiscountId:
          coupon.discountOfferId,
      },
    });

  return discountOffer;
}