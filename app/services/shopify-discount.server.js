import { buildCreateInput } from "../utils/discount-builder.server";

import { buildUpdateInput } from "../utils/discount-builder.server";

const CREATE_DISCOUNT_MUTATION = `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
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
  const input = buildCreateInput(body);

  console.log(
    "Shopify Discount Input",
    JSON.stringify(input, null, 2),
  );

  const response = await admin.graphql(
    CREATE_DISCOUNT_MUTATION,
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

  const payload =
    result?.data?.discountCodeBasicCreate;

  if (!payload) {
    throw new Error("Invalid Shopify response.");
  }

  if (payload.userErrors.length) {
    throw new Error(
      payload.userErrors
        .map((e) => e.message)
        .join(", "),
    );
  }

  return {
    id: payload.codeDiscountNode.id,

    discount: payload.codeDiscountNode.codeDiscount,
  };
}


export async function updateShopifyDiscount(
  admin,
  discountId,
  discountData
) {

  const response = await admin.graphql(
    `#graphql
    mutation DiscountCodeBasicUpdate(
      $id: ID!
      $basicCodeDiscount: DiscountCodeBasicInput!
    ) {
      discountCodeBasicUpdate(
        id: $id
        basicCodeDiscount: $basicCodeDiscount
      ) {
        codeDiscountNode {
          id
        }
        userErrors {
          field
          code
          message
        }
      }
    }
    `,
    {
      variables: {
        id: discountId,
        basicCodeDiscount: buildUpdateInput(discountData),
      },
    }
  );

  const { data, errors } = await response.json();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data.discountCodeBasicUpdate;
}