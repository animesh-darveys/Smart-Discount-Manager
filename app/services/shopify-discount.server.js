import { buildDiscountInput } from "../utils/buildDiscountInput";

const DISCOUNT_CREATE_MUTATION = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id

      codeDiscount {
        ... on DiscountCodeBasic {
          title

          codes(first: 10) {
            nodes {
              code
            }
          }

          startsAt
          endsAt

          customerSelection {
            ... on DiscountCustomerAll {
              allCustomers
            }
          }

          customerGets {
            value {
              ... on DiscountPercentage {
                percentage
              }

              ... on DiscountAmount {
                amount {
                  amount
                  currencyCode
                }
              }
            }

            items {
              ... on AllDiscountItems {
                allItems
              }
            }
          }

          usageLimit
          appliesOncePerCustomer
        }
      }
    }

    userErrors {
      field
      code
      message
    }
  }
}
`;

export async function createShopifyDiscount(admin, body) {
  const input = buildDiscountInput(body);

  const response = await admin.graphql(
    DISCOUNT_CREATE_MUTATION,
    {
      variables: {
        basicCodeDiscount: input,
      },
    },
  );

  const result = await response.json();

  console.log(
    "Shopify Discount Response",
    JSON.stringify(result, null, 2),
  );

  const errors =
    result?.data?.discountCodeBasicCreate?.userErrors ?? [];

  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  return {
    shopifyDiscountId:
      result.data.discountCodeBasicCreate.codeDiscountNode.id,

    response:
      result.data.discountCodeBasicCreate,
  };
}