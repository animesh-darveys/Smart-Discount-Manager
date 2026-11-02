import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {

  try {
    // -----------------------------------------
    // Authenticate Shopify Webhook
    // -----------------------------------------

    const { shop, payload, admin } = await authenticate.webhook(request);

    // -----------------------------------------
    // Fetch Order Discount Information
    // -----------------------------------------

    const orderId = payload.admin_graphql_api_id;

    const response = await admin.graphql(
      `#graphql
      query GetOrderDiscounts($orderId: ID!) {
        order(id: $orderId) {
          discountCodes

          totalDiscountsSet {
            shopMoney {
              amount
              currencyCode
            }
          }

          discountApplications(first: 20) {
            nodes {
              __typename

              value {
                ... on MoneyV2 {
                  amount
                  currencyCode
                }

                ... on PricingPercentageValue {
                  percentage
                }
              }

              ... on DiscountCodeApplication {
                code
              }
            }
          }
        }
      }
      `,
      {
        variables: {
          orderId,
        },
      }
    );

    const data = await response.json();

    // -----------------------------------------
    // GraphQL Error
    // -----------------------------------------

    if (data.errors) {
      return new Response("GraphQL error", {
        status: 500,
      });
    }

    // -----------------------------------------
    // Get Order
    // -----------------------------------------

    const order = data.data?.order;

    if (!order) {
      return new Response("Order not found", {
        status: 404,
      });
    }

    // -----------------------------------------
    // Get Applied Discount Codes
    // -----------------------------------------

    const discountApplications =
      order.discountApplications?.nodes || [];

    const discountCodes = discountApplications
      .filter(
        (discount) =>
          discount.__typename ===
          "DiscountCodeApplication"
      )
      .map((discount) => discount.code)
      .filter(Boolean);

    // -----------------------------------------
    // No Discount Code Applied
    // -----------------------------------------

    if (discountCodes.length === 0) {
      return new Response("No discount code", {
        status: 200,
      });
    }

    // -----------------------------------------
    // Update DiscountOffer Status
    // -----------------------------------------

    for (const discountCode of discountCodes) {
      const discountOffer =
        await prisma.discountOffer.findFirst({
          where: {
            shop: shop,
            discountCode: discountCode,
            source: "AUTO_REWARD",
          },
        });

      // -----------------------------------------
      // DiscountOffer Not Found
      // -----------------------------------------

      if (!discountOffer) {
        continue;
      }

      // -----------------------------------------
      // Already Used
      // -----------------------------------------

      if (discountOffer.status === "used") {
        continue;
      }

      // -----------------------------------------
      // Mark DiscountOffer as Used
      // -----------------------------------------

      await prisma.discountOffer.update({
        where: {
          id: discountOffer.id,
        },
        data: {
          status: "used",
        },
      });
    }

    return new Response("OK", {
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(
      "Webhook processing failed",
      {
        status: 500,
      }
    );
  }
};