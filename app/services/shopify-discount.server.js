import { buildCreateInput } from "../utils/discount-builder.server";

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

export async function createDiscount(admin, body) {
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