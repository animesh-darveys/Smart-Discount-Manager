import { getShopSettings } from "./settings.service.server";

// Start of the UTC calendar day containing `date`, shifted by `offsetDays`.
export function startOfUtcDay(date, offsetDays = 0) {
  const day = new Date(date);

  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() + offsetDays);

  return day;
}

// Accepts "YYYY-MM-DD" (a `date` metafield, treated as that UTC day) or a
// full ISO 8601 timestamp. Rejects anything else, e.g. "05/10/2026", which
// Date.parse would read as 10 May.
export function parseDeliveredAt(value) {
  const raw = value?.trim();

  if (!raw) {
    return null;
  }

  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00Z`
    : raw;

  if (!/^\d{4}-\d{2}-\d{2}T/.test(iso)) {
    return null;
  }

  const timestamp = Date.parse(iso);

  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

// Orders are delivered after they are created, so only orders created up to
// this many days before the delivery window can qualify.
const MAX_DAYS_FROM_ORDER_TO_DELIVERY = 60;

// Orders delivered on any UTC calendar day from
// (rewardEligibilityDays + rewardGracePeriodDays) to rewardEligibilityDays
// days ago (inclusive) are fetched, whatever the time of day.
function getDeliveryWindowDays(settings) {
  const minDaysAgo = Number(settings.rewardEligibilityDays);
  // Number("") is 0, so an empty field would silently shrink the window.
  const gracePeriodDays =
    String(settings.rewardGracePeriodDays ?? "").trim() === ""
      ? NaN
      : Number(settings.rewardGracePeriodDays);

  if (!Number.isInteger(minDaysAgo) || minDaysAgo <= 0) {
    throw new Error("Invalid reward eligibility days setting");
  }

  if (!Number.isInteger(gracePeriodDays) || gracePeriodDays < 0) {
    throw new Error("Invalid reward grace period days setting");
  }

  return {
    minDaysAgo,
    maxDaysAgo: minDaysAgo + gracePeriodDays,
  };
}

export async function getDeliveredOrders(admin) {
  const { settings } = await getShopSettings(admin);
  const { minDaysAgo, maxDaysAgo } = getDeliveryWindowDays(settings);

  const now = new Date();

  // Inclusive: start of the UTC day maxDaysAgo days ago.
  const minimumDeliveredDate = startOfUtcDay(now, -maxDaysAgo);

  // Exclusive: start of the UTC day after minDaysAgo days ago.
  // This includes the entire day minDaysAgo days ago.
  const deliveredBeforeDate = startOfUtcDay(now, -minDaysAgo + 1);

  console.log(
    `Delivery window : ${minimumDeliveredDate.toISOString()} to before ${deliveredBeforeDate.toISOString()} (${minDaysAgo}-${maxDaysAgo} days ago)`
  );

  const createdAfter = startOfUtcDay(
    minimumDeliveredDate,
    -MAX_DAYS_FROM_ORDER_TO_DELIVERY
  );

  const ordersQuery = `fulfillment_status:fulfilled AND created_at:>='${createdAfter.toISOString()}'`;

  const minimumTimestamp = minimumDeliveredDate.getTime();
  const maximumTimestampExclusive = deliveredBeforeDate.getTime();

  const deliveredOrders = [];
  let hasNextPage = true;
  let cursor = null;

  const query = `#graphql
    query GetOrders($query: String!, $cursor: String) {
      orders(
        first: 250
        after: $cursor
        query: $query
        sortKey: CREATED_AT
        reverse: true
      ) {
        nodes {
          id
          name
          cancelledAt

          orderStatus: metafield(
            namespace: "custom"
            key: "order_status"
          ) {
            value
          }

          orderDeliveredAt: metafield(
            namespace: "custom"
            key: "order_delivered_at"
          ) {
            value
          }

          returns(first: 1) {
            nodes {
              id
            }
          }

          customer {
            id
            firstName
            lastName
            defaultEmailAddress {
              emailAddress
              marketingState
            }
          }

          currentTotalPriceSet {
            shopMoney {
              amount
            }
          }
        }

        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  while (hasNextPage) {
    const response = await admin.graphql(query, {
      variables: {
        query: ordersQuery,
        cursor,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch orders: HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (data.errors?.length) {
      throw new Error(
        `Failed to fetch orders: ${JSON.stringify(data.errors)}`
      );
    }

    const ordersData = data.data?.orders;

    if (
      !Array.isArray(ordersData?.nodes) ||
      !ordersData?.pageInfo
    ) {
      throw new Error("Orders data was missing or invalid.");
    }

    for (const order of ordersData.nodes) {
      const orderStatus =
        order.orderStatus?.value?.trim().toLowerCase();

      if (orderStatus !== "delivered") {
        continue;
      }

      if (order.cancelledAt) {
        console.log(`⏭️ Cancelled Order : ${order.name}`);
        continue;
      }

      // Exclude any order with a return record.
      if (order.returns?.nodes?.length > 0) {
        console.log(`⏭️ Return Found : ${order.name}`);
        continue;
      }

      const deliveredAt = parseDeliveredAt(
        order.orderDeliveredAt?.value
      );

      if (!deliveredAt) {
        console.log(
          `⏭️ Invalid Delivered Date : ${order.name} | Value : ${order.orderDeliveredAt?.value}`
        );
        continue;
      }

      const deliveredTimestamp = deliveredAt.getTime();

      if (
        deliveredTimestamp >= minimumTimestamp &&
        deliveredTimestamp < maximumTimestampExclusive
      ) {
        deliveredOrders.push(order);
      }
    }

    const pageInfo = ordersData.pageInfo;
    hasNextPage = pageInfo.hasNextPage;

    if (hasNextPage) {
      if (
        !pageInfo.endCursor ||
        pageInfo.endCursor === cursor
      ) {
        throw new Error(
          "Pagination could not advance: missing or unchanged cursor."
        );
      }

      cursor = pageInfo.endCursor;
    }
  }

  return deliveredOrders;
}
