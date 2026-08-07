import prisma from "../db.server";

import { generateCoupon } from "./reward-coupon.service.server";
import { createDiscountOffer } from "./reward-discount-offer.service.server";
import { sendRewardEmail } from "./reward-email.service.server";

export async function syncOrdersToRewards(shop, orders) {
  console.log("========== SYNC ORDERS TO REWARDS ==========");

  let inserted = 0;
  let skipped = 0;

  if (!orders.length) {
    console.log("No delivered orders found.");

    return {
      inserted,
      skipped,
    };
  }

  const existingRewards = await prisma.reward.findMany({
    where: {
      orderId: {
        in: orders.map((order) => order.id),
      },
    },
    select: {
      orderId: true,
    },
  });

  const existingOrderIds = new Set(
    existingRewards.map((reward) => reward.orderId)
  );

  for (const order of orders) {
    try {
      if (!order.customer?.id) {
        console.log(`⏭️ Guest Order Skipped : ${order.name}`);
        skipped++;
        continue;
      }

      if (existingOrderIds.has(order.id)) {
        console.log(`⏭️ Reward already exists : ${order.name}`);
        skipped++;
        continue;
      }

      if (!order.orderDeliveredAt?.value) {
        console.log(`⏭️ Delivered date missing : ${order.name}`);
        skipped++;
        continue;
      }

      const deliveredAt = new Date(order.orderDeliveredAt.value);

      const eligibleAt = new Date(deliveredAt);
      eligibleAt.setDate(eligibleAt.getDate() + 14);

      const orderAmount = Number(order.totalPriceSet.shopMoney.amount);

      const cashbackAmount = Math.floor(orderAmount * 0.05);

      await prisma.reward.create({
        data: {
          shop,

          orderId: order.id,
          orderName: order.name,

          customerId: order.customer.id,
          customerEmail: order.customer.email,
          customerName:
            `${order.customer.firstName ?? ""} ${order.customer.lastName ?? ""}`.trim() ||
            null,

          cashbackAmount,

          deliveredAt,
          eligibleAt,

          status: "PENDING",
        },
      });

      inserted++;

      console.log(
        `✅ Reward Created : ${order.name} | Eligible At : ${eligibleAt.toISOString()}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to create reward for ${order.name}`,
        error
      );
    }
  }

  console.log("========== SYNC COMPLETED ==========");
  console.log(`Inserted : ${inserted}`);
  console.log(`Skipped  : ${skipped}`);

  return {
    inserted,
    skipped,
  };
}

export async function processPendingRewards(admin, shop) {
  console.log("========== PROCESS PENDING REWARDS ==========");

  const pendingRewards = await prisma.reward.findMany({
    where: {
      shop,
      status: "PENDING",
      eligibleAt: {
        lte: new Date(),
      },
    },
    orderBy: {
      eligibleAt: "asc",
    },
  });

  console.log(
    `Eligible Pending Rewards : ${pendingRewards.length}`
  );

  let completed = 0;
  let failed = 0;

  for (const reward of pendingRewards) {

    let coupon;
    let discountOffer;

    // --------------------------------------------------
    // Reward Generation
    // --------------------------------------------------
    try {

      console.log(`Processing Order : ${reward.orderId}`);

      coupon = await generateCoupon(admin, reward);

      discountOffer = await createDiscountOffer(
        shop,
        reward,
        coupon
      );

      await prisma.reward.update({
        where: {
          id: reward.id,
        },
        data: {
          status: "COMPLETED",
          generatedAt: new Date(),

          discountOfferId: discountOffer.id,
          discountCode: coupon.discountCode,

          errorMessage: null,
        },
      });

      completed++;

      console.log(
        `✅ Reward Completed : ${reward.orderName}`
      );

      console.log(
        `Discount Code : ${coupon.discountCode}`
      );

      console.log(
        `Discount Offer : ${discountOffer.id}`
      );

    } catch (error) {

      failed++;

      console.error(
        `❌ Reward Generation Failed : ${reward.orderId}`,
        error
      );

      await prisma.reward.update({
        where: {
          id: reward.id,
        },
        data: {
          retryCount: {
            increment: 1,
          },
          errorMessage: `Reward Error: ${error.message}`,
        },
      });

      continue;
    }

    // --------------------------------------------------
    // Email Sending (Independent)
    // --------------------------------------------------
    try {

      await sendRewardEmail({
        customerEmail: reward.customerEmail,
        customerName: reward.customerName,
        discountCode: coupon.discountCode,
        cashbackAmount: reward.cashbackAmount.toString(),
        expiryDate: coupon.endDate,
      });

      await prisma.reward.update({
        where: {
          id: reward.id,
        },
        data: {
          emailSentAt: new Date(),
        },
      });

      console.log(
        `📧 Reward Email Sent : ${reward.customerEmail}`
      );

    } catch (error) {

      console.error(
        `❌ Email Sending Failed : ${reward.customerEmail}`,
        error
      );

      await prisma.reward.update({
        where: {
          id: reward.id,
        },
        data: {
          retryCount: {
            increment: 1,
          },
          errorMessage: `Email Error: ${error.message}`,
        },
      });
    }
  }

  console.log("========== REWARD PROCESS COMPLETED ==========");

  return {
    total: pendingRewards.length,
    completed,
    failed,
  };
}