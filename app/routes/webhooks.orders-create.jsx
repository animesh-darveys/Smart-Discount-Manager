import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  console.log("=================================");
  console.log("🔥 ORDER CREATE WEBHOOK RECEIVED");
  console.log("=================================");

  try {
    // -----------------------------------------
    // Authenticate Shopify Webhook
    // -----------------------------------------

    const { shop, payload, admin } =
      await authenticate.webhook(request);

    console.log("Shop:", shop);
    console.log("Order ID:", payload.id);

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
      console.error("❌ GraphQL Errors:");
      console.error(
        JSON.stringify(data.errors, null, 2)
      );

      return new Response("GraphQL error", {
        status: 500,
      });
    }

    // -----------------------------------------
    // Get Order
    // -----------------------------------------

    const order = data.data?.order;

    if (!order) {
      console.error("❌ Order not found:", orderId);

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

    console.log("=================================");
    console.log("🎟️ APPLIED DISCOUNTS");
    console.log("=================================");

    console.log(
      "Discount Codes:",
      discountCodes
    );

    console.log(
      "Total Discount:",
      order.totalDiscountsSet?.shopMoney?.amount,
      order.totalDiscountsSet?.shopMoney?.currencyCode
    );

    // -----------------------------------------
    // No Discount Code Applied
    // -----------------------------------------

    if (discountCodes.length === 0) {
      console.log(
        "ℹ️ No discount code applied to this order"
      );

      return new Response("No discount code", {
        status: 200,
      });
    }

    // -----------------------------------------
    // Update DiscountOffer Status
    // -----------------------------------------

    for (const discountCode of discountCodes) {
      console.log(
        `🔍 Searching DiscountOffer: ${discountCode}`
      );

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
        console.log(
          `⚠️ DiscountOffer not found: ${discountCode}`
        );

        continue;
      }

      console.log(
        `✅ DiscountOffer found: ${discountOffer.id}`
      );

      // -----------------------------------------
      // Already Used
      // -----------------------------------------

      if (discountOffer.status === "used") {
        console.log(
          `ℹ️ Discount already marked as used: ${discountCode}`
        );

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

      console.log(
        `✅ DiscountOffer marked as USED: ${discountCode}`
      );
    }

    console.log("=================================");
    console.log("✅ ORDER WEBHOOK PROCESSING COMPLETE");
    console.log("=================================");

    return new Response("OK", {
      status: 200,
    });

  } catch (error) {
    console.error("=================================");
    console.error("❌ WEBHOOK ERROR");
    console.error("=================================");
    console.error(error);

    return new Response(
      "Webhook processing failed",
      {
        status: 500,
      }
    );
  }
};