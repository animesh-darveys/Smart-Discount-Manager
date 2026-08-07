import { authenticate } from "../shopify.server";

import { getDeliveredOrders } from "../services/order.service.server";

import {
  syncOrdersToRewards,
  processPendingRewards,
} from "../services/reward.service.server";

export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);

    // Step 1 - Fetch delivered orders
    const orders = await getDeliveredOrders(admin);

    // Step 2 - Sync rewards
    const syncResult = await syncOrdersToRewards(
      session.shop,
      orders
    );

    // Step 3 - Process pending rewards
    const processResult = await processPendingRewards(
      admin,
      session.shop
    );

    return Response.json({
      success: true,
      sync: syncResult,
      process: processResult,
    });

  } catch (error) {
    console.error("Reward Cron Error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}