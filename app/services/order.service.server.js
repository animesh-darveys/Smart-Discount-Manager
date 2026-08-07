export async function getDeliveredOrders(admin) {
  // Last 30 days
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const fromDate = last30Days.toISOString().split("T")[0];
  const todayDate = new Date().toISOString().split("T")[0];

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

          returns(first: 10) {
            nodes {
              id
              status
            }
          }

          customer {
            id
            email
            firstName
            lastName
          }

          totalPriceSet {
            shopMoney {
              amount
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
    throw new Error(JSON.stringify(data.errors));
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

  // Only valid delivered orders
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
      Customer: `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim(),
      DeliveredAt: order.orderDeliveredAt?.value,
      Amount: order.totalPriceSet.shopMoney.amount,
    }))
  );

  return deliveredOrders;
}