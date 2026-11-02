import prisma from "../db.server";
import { getShopSettings } from "./settings.service.server";
import { generateCoupon } from "./reward-coupon.service.server";
import { createDiscountOffer } from "./reward-discount-offer.service.server";
import { sendRewardEmail } from "./reward-email.service.server";
import { deleteShopifyDiscount } from "./shopify-discount.server";
import {
  parseDeliveredAt,
  startOfUtcDay,
} from "./order.service.server";

const AUTO_REWARD_SOURCE = "AUTO_REWARD";

export async function syncOrdersToRewards(admin, shop, orders) {
  const { settings, currency } = await getShopSettings(admin);
  
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  if (!orders.length) {
    return {
      inserted,
      skipped,
      failed,
    };
  }

  // --------------------------------------------------
  // Duplicate Check
  // --------------------------------------------------
  const existingOffers = await prisma.discountOffer.findMany({
    where: {
      shop,
      source: AUTO_REWARD_SOURCE,
      orderId: {
        in: orders.map((order) => order.id),
      },
    },
    select: {
      orderId: true,
    },
  });

  const existingOrderIds = new Set(
    existingOffers.map((offer) => offer.orderId)
  );

  for (const order of orders) {
    try {
      console.log(`\nProcessing Order : ${order.name}`);

      // --------------------------------------------------
      // Customer Validation
      // --------------------------------------------------
      if (!order.customer?.id) {
        console.log(`⏭️ Guest Order Skipped : ${order.name}`);
        skipped++;
        continue;
      }

      // --------------------------------------------------
      // Duplicate Check
      // --------------------------------------------------
      if (existingOrderIds.has(order.id)) {
        console.log(
          `⏭️ Cashback Discount Already Exists : ${order.name}`
        );

        skipped++;
        continue;
      }

      // --------------------------------------------------
      // Delivered Date Validation
      // --------------------------------------------------
      const deliveredAt = parseDeliveredAt(
        order.orderDeliveredAt?.value
      );

      if (!deliveredAt) {
        console.log(
          `⏭️ Delivered Date Missing : ${order.name}`
        );

        skipped++;
        continue;
      }

      // --------------------------------------------------
      // 14-Day Eligibility Check
      // --------------------------------------------------
      // Calendar days, not exact hours: an order delivered at any time on
      // 5 Oct is eligible from the start of 19 Oct (UTC).
      const eligibilityDays =  Number(settings.rewardEligibilityDays);
      const eligibleAt = startOfUtcDay(deliveredAt, eligibilityDays);

      const cashbackPercentage = Number(settings.cashbackPercentage);


      if (
        !Number.isFinite(eligibilityDays) ||
        eligibilityDays <= 0
      ) {
        throw new Error("Invalid reward eligibility days setting");
      }

      if (
        !Number.isFinite(cashbackPercentage) ||
        cashbackPercentage <= 0
      ) {
        throw new Error("Invalid cashback percentage setting");
      }

      if (new Date() < eligibleAt) {
        console.log(
          `⏭️ Order Not Eligible Yet : ${order.name} | Eligible At : ${eligibleAt.toISOString()}`
        );

        skipped++;
        continue;
      }

      // --------------------------------------------------
      // Order Amount
      // --------------------------------------------------
      // Current total, so refunds and order edits reduce the cashback.
      const orderAmount = Number(
        order.currentTotalPriceSet?.shopMoney?.amount
      );

      if (!Number.isFinite(orderAmount)) {
        console.log(`⏭️ Invalid Order Amount : ${order.name}`);
        skipped++;
        continue;
      }

      // --------------------------------------------------
      // Calculate 5% Cashback
      // --------------------------------------------------
      const cashbackAmount = Number((orderAmount * (cashbackPercentage / 100)).toFixed(2));

      if (!Number.isFinite(cashbackAmount) || cashbackAmount <= 0) {
        console.log(
          `⏭️ No Cashback (order total ${orderAmount}) : ${order.name}`
        );
        skipped++;
        continue;
      }

      const customerEmail =
        order.customer?.defaultEmailAddress?.emailAddress;

      const customerName =
        `${order.customer?.firstName ?? ""} ${
          order.customer?.lastName ?? ""
        }`.trim();

      // --------------------------------------------------
      // Create Shopify Discount
      // --------------------------------------------------
      const coupon = await generateCoupon(admin, {
        orderId: order.id,
        orderName: order.name,
        customerId: order.customer.id,
        customerEmail,
        customerName,
        deliveredAt,
        eligibleAt,
        cashbackAmount,
        couponValidityDays: settings.couponValidityDays,
      });

      console.log(`✅ Shopify Discount Created : ${coupon.discountCode}`);

      // --------------------------------------------------
      // Create DiscountOffer
      // --------------------------------------------------
      let discountOffer;

      try {
        discountOffer = await createDiscountOffer(
          shop,
          {
            orderId: order.id,
            orderName: order.name,
            customerId: order.customer.id,
            customerEmail,
            customerName,
            cashbackAmount,
            deliveredAt,
          },
          coupon
        );
      } catch (dbError) {
        // Don't leave a usable Shopify code without a DB record (e.g. a
        // concurrent run already saved a reward for this order).
        try {
          await deleteShopifyDiscount(admin, coupon.shopifyDiscountId);
          console.log(
            `🧹 Removed Shopify Discount After Failed Save : ${coupon.discountCode}`
          );
        } catch (cleanupError) {
          console.error(
            `❌ Failed To Remove Shopify Discount : ${coupon.discountCode}`,
            cleanupError
          );
        }

        throw dbError;
      }

      console.log(
        `✅ DiscountOffer Created : ${discountOffer.id}`
      );

      inserted++;

      // --------------------------------------------------
      // Send Email
      // --------------------------------------------------
      try {
        if (!customerEmail) {
          console.log(`⏭️ Email Skipped - Customer Email Missing : ${order.name}`);
        } else {
          await sendRewardEmail({
            customerEmail,
            customerName,
            discountCode: coupon.discountCode,
            cashbackAmount,
            currency,
            expiryDate: coupon.endDate,
          });

          // --------------------------------------------------
          // Update emailSentAt
          // --------------------------------------------------
          await prisma.discountOffer.update({
            where: {
              id: discountOffer.id,
            },
            data: {
              emailSentAt: new Date(),
            },
          });

          console.log(
            `📧 Reward Email Sent : ${customerEmail}`
          );
        }
      } catch (emailError) {
        console.error(
          `❌ Email Sending Failed : ${customerEmail}`,
          emailError
        );
      }

      console.log(
        `✅ Cashback Flow Completed : ${order.name}`
      );
    } catch (error) {
      failed++;

      console.error(
        `❌ Cashback Generation Failed : ${order.name}`,
        error
      );
    }
  }
  
  return {
    inserted,
    skipped,
    failed,
  };
}