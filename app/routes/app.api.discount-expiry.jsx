import { authenticate } from "../shopify.server";
import {
  JobAlreadyRunningError,
  runJobForShop,
} from "../services/scheduled-jobs.server";

// Manual run from the admin. The scheduled run is POST /api/cron/discount-expiry.
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    const result = await runJobForShop(
      "discount-expiry",
      admin,
      session.shop
    );

    return Response.json(result);
  } catch (error) {
    console.error("Discount Expiry Error:", error);

    return Response.json(
      { success: false, error: error.message },
      { status: error instanceof JobAlreadyRunningError ? 409 : 500 }
    );
  }
};
