import { createHash, timingSafeEqual } from "node:crypto";
import {
  JOBS,
  runJobForAllShops,
} from "../services/scheduled-jobs.server";

// POST /api/cron/process-cashback-rewards
// POST /api/cron/discount-expiry
// Header: Authorization: Bearer <CRON_SECRET>
// Optional: ?shop=your-store.myshopify.com to run for one shop only.

const MIN_SECRET_LENGTH = 32;

function isAuthorized(request) {
  // eslint-disable-next-line no-undef
  const secret = process.env.CRON_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    console.error(
      `CRON_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters; cron endpoints are disabled.`
    );
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Hash both sides so the comparison is constant-time and length-safe.
  const expected = createHash("sha256").update(secret).digest();
  const received = createHash("sha256").update(token).digest();

  return timingSafeEqual(expected, received);
}

export const loader = () =>
  new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });

export async function action({ request, params }) {
  if (request.method !== "POST") {
    return loader();
  }

  if (!isAuthorized(request)) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const jobName = params.job;

  if (!Object.hasOwn(JOBS, jobName)) {
    return Response.json(
      { success: false, error: "Unknown job" },
      { status: 404 }
    );
  }

  const shop = new URL(request.url).searchParams.get("shop") || undefined;

  const startedAt = new Date();
  let results;

  try {
    results = await runJobForAllShops(jobName, shop);
  } catch (error) {
    console.error(`Cron ${jobName} failed:`, error);

    return Response.json(
      { success: false, job: jobName, error: "Job failed; see server logs." },
      { status: 500 }
    );
  }

  if (shop && results.length === 0) {
    return Response.json(
      { success: false, job: jobName, error: "Shop is not installed." },
      { status: 404 }
    );
  }

  console.log(
    `Cron ${jobName} finished in ${Date.now() - startedAt.getTime()}ms for ${results.length} shop(s)`
  );

  return Response.json({
    success: results.every((result) => result.success),
    job: jobName,
    startedAt: startedAt.toISOString(),
    results,
  });
}
