import prisma from "../db.server";

import { generateCoupon } from "./coupon.service.server";

import { createDiscountOffer } from "./discount-offer.service.server";

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

    // Fetch all existing rewards in a single query
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

    // Convert to Set for O(1) lookup
    const existingOrderIds = new Set(
        existingRewards.map((reward) => reward.orderId)
    );

    for (const order of orders) {
        try {
            // Skip guest orders
            if (!order.customer?.id) {
                console.log(`⏭️ Guest Order Skipped : ${order.name}`);
                skipped++;
                continue;
            }

            // Skip if reward already exists
            if (existingOrderIds.has(order.id)) {
                console.log(`⏭️ Reward already exists : ${order.name}`);
                skipped++;
                continue;
            }

            // Skip if delivered date is missing
            if (!order.orderDeliveredAt?.value) {
                console.log(`⏭️ Delivered date missing : ${order.name}`);
                skipped++;
                continue;
            }

            const deliveredAt = new Date(order.orderDeliveredAt.value);

            // Eligible after 14 days
            const eligibleAt = new Date(deliveredAt);
            eligibleAt.setDate(eligibleAt.getDate() + 14);

            // 👇 ADD THIS HERE
            const orderAmount = Number(order.totalPriceSet.shopMoney.amount);

            const cashbackAmount = Number(
                (orderAmount * 0.05).toFixed(2)
            );

            await prisma.reward.create({
                data: {
                    shop,

                    orderId: order.id,
                    orderName: order.name,
                    customerId: order.customer.id,

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
        try {
            console.log(`Processing Order : ${reward.orderId}`);

            const coupon = await generateCoupon(admin, reward);

            const discountOffer =
            await createDiscountOffer(
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
                `❌ Coupon Generation Failed : ${reward.orderId}`,
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

                    errorMessage: error.message,
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