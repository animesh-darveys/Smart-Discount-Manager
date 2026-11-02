import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import { getDeliveredOrders } from "./order.service.server";
import { syncOrdersToRewards } from "./reward.service.server";
import { expireDiscounts } from "./discount-expiry.server";

export const JOBS = {
  "process-cashback-rewards": async (admin, shop) => {
    const orders = await getDeliveredOrders(admin);

    return syncOrdersToRewards(admin, shop, orders);
  },

  "discount-expiry": (admin, shop) => expireDiscounts(admin, shop),
};

export class JobAlreadyRunningError extends Error {}

// Per-process lock: stops the cron and the admin URL (or two cron calls)
// running the same job for the same shop at once. Assumes one Node process.
const runningJobs = new Set();

export async function runJobForShop(jobName, admin, shop) {
  const job = JOBS[jobName];

  if (!job) {
    throw new Error(`Unknown job: ${jobName}`);
  }

  const lockKey = `${jobName}:${shop}`;

  if (runningJobs.has(lockKey)) {
    throw new JobAlreadyRunningError(
      `${jobName} is already running for ${shop}`
    );
  }

  runningJobs.add(lockKey);

  try {
    return await job(admin, shop);
  } finally {
    runningJobs.delete(lockKey);
  }
}

// Shops that installed the app (they have an offline session).
export async function getInstalledShops() {
  const sessions = await prisma.session.findMany({
    where: { isOnline: false },
    select: { shop: true },
    distinct: ["shop"],
  });

  return sessions.map((session) => session.shop);
}

// Runs a job for every installed shop (or just `onlyShop`) using the
// stored offline token, so it works without anyone opening the admin.
export async function runJobForAllShops(jobName, onlyShop) {
  const installedShops = await getInstalledShops();

  const shops = onlyShop
    ? installedShops.filter((shop) => shop === onlyShop)
    : installedShops;

  const results = [];

  for (const shop of shops) {
    try {
      const { admin } = await unauthenticated.admin(shop);
      const result = await runJobForShop(jobName, admin, shop);

      results.push({ shop, success: true, result });
    } catch (error) {
      console.error(`Scheduled job ${jobName} failed for ${shop}:`, error);

      results.push({
        shop,
        success: false,
        skipped: error instanceof JobAlreadyRunningError,
        error: error.message,
      });
    }
  }

  return results;
}
