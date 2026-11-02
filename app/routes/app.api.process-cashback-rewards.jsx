import { authenticate } from "../shopify.server";

import {
  JobAlreadyRunningError,
  runJobForShop,
} from "../services/scheduled-jobs.server";

// Manual run from the admin. The scheduled run is POST /api/cron/process-cashback-rewards.
export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);

    // Fetch delivered orders, then process the cashback flow.
    const result = await runJobForShop(
      "process-cashback-rewards",
      admin,
      session.shop
    );

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("Cashback Processing Error:", error);

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: error instanceof JobAlreadyRunningError ? 409 : 500,
      }
    );
  }
}
