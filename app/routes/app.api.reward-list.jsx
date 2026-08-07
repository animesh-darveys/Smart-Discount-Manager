import { authenticate } from "../shopify.server";
import { getRewards } from "../services/reward-query.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);

    const rewards = await getRewards(session.shop);

    return Response.json({
      success: true,
      count: rewards.length,
      data: rewards,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
};