import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);

    // Last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Date strings for Shopify query
    const fromDate = last30Days.toISOString().split("T")[0];

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    const response = await admin.graphql(
      `#graphql
      query GetOrders($query: String!) {
        orders(
          first: 100
          query: $query
          sortKey: CREATED_AT
          reverse: true
        ) {
          nodes {
            id
            name
            createdAt

            displayFinancialStatus
            displayFulfillmentStatus

            orderStatus: metafield(namespace: "custom", key: "order_status") {
              value
            }

            orderDeliveredAt: metafield(namespace: "custom", key: "order_delivered_at") {
              value
            }

            returns(first: 10) {
              nodes {
                id
                status
              }
            }

            customer {
              id
              firstName
              lastName
            }

            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
      `,
      {
        variables: {
          query: `created_at:>=${fromDate} AND created_at:<=${todayDate} AND fulfillment_status:fulfilled`,
        },
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error(data.errors);

      return Response.json(
        {
          success: false,
          errors: data.errors,
        },
        { status: 500 }
      );
    }

    const orders = data.data.orders.nodes || [];

    console.log("========== ALL ORDERS ==========");
    console.table(
      orders.map((order) => ({
        Order: order.name,
        Payment: order.displayFinancialStatus,
        Fulfillment: order.displayFulfillmentStatus,
        OrderStatus: order.orderStatus?.value,
        DeliveredAt: order.orderDeliveredAt?.value,
      }))
    );

    // Filter only delivered orders
    const deliveredOrders = orders.filter((order) => {
      const orderStatus =
        order.orderStatus?.value?.trim().toLowerCase() || "";

      const hasReturn = order.returns?.nodes?.length > 0;

      return (
        order.displayFinancialStatus === "PAID" &&
        order.displayFulfillmentStatus === "FULFILLED" &&
        orderStatus === "delivered" &&
        !hasReturn
      );
    });

    console.log("========== DELIVERED ORDERS ==========");
    console.table(
      deliveredOrders.map((order) => ({
        Order: order.name,
        DeliveredAt: order.orderDeliveredAt?.value,
      }))
    );

    // Filter only 14+ days delivered orders
    const rewardOrders = deliveredOrders.filter((order) => {
      if (!order.orderDeliveredAt?.value) return false;

      const deliveredAt = new Date(order.orderDeliveredAt.value);

      const diffInDays = Math.floor(
        (today.getTime() - deliveredAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      console.log(
        `Order: ${order.name} | Delivered: ${order.orderDeliveredAt.value} | Days: ${diffInDays}`
      );

      return diffInDays >= 14;
    });

    console.log("========== REWARD ELIGIBLE ORDERS ==========");
    console.table(
      rewardOrders.map((order) => ({
        Order: order.name,
        Customer: `${order.customer?.firstName ?? ""} ${
          order.customer?.lastName ?? ""
        }`.trim(),
        DeliveredAt: order.orderDeliveredAt?.value,
        Amount: order.totalPriceSet.shopMoney.amount,
        Currency: order.totalPriceSet.shopMoney.currencyCode,
      }))
    );

    return Response.json({
      success: true,
      count: rewardOrders.length,
      orders: rewardOrders,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}