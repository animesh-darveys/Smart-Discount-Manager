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

const GET_DISCOUNT_PRODUCTS_QUERY = `
query GetDiscount($id: ID!) {
  codeDiscountNode(id: $id) {
    codeDiscount {
      ... on DiscountCodeBasic {
        customerGets {
          items {
            ... on DiscountProducts {
              products(first: 250) {
                nodes {
                  id
                }
              }
            }

            ... on DiscountCollections {
              collections(first: 250) {
                nodes {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const UPDATE_DISCOUNT_MUTATION = `
mutation discountCodeBasicUpdate(
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
`;
const DELETE_DISCOUNT_MUTATION = `
mutation discountCodeDelete($id: ID!) {
  discountCodeDelete(id: $id) {
    deletedCodeDiscountId
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

const DEACTIVATE_DISCOUNT_MUTATION = `
mutation discountCodeDeactivate($id: ID!) {
  discountCodeDeactivate(id: $id) {
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

export async function deactivateShopifyDiscount(admin, id) {
  const response = await admin.graphql(
    DEACTIVATE_DISCOUNT_MUTATION,
    {
      variables: { id },
    },
  );

  const result = await response.json();

  const payload = result.data.discountCodeDeactivate;

  if (payload.userErrors.length) {
    throw new Error(
      payload.userErrors.map((e) => e.message).join(", ")
    );
  }

  return payload;
}

const ACTIVATE_DISCOUNT_MUTATION = `
mutation discountCodeActivate($id: ID!) {
  discountCodeActivate(id: $id) {
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

export async function activateShopifyDiscount(admin, id) {
  const response = await admin.graphql(
    ACTIVATE_DISCOUNT_MUTATION,
    {
      variables: { id },
    },
  );

  const result = await response.json();

  const payload = result.data.discountCodeActivate;

  if (payload.userErrors.length) {
    throw new Error(
      payload.userErrors.map((e) => e.message).join(", ")
    );
  }

  return payload;
}

export async function updateShopifyDiscount(admin, body) {
  const existingResponse = await admin.graphql(
  GET_DISCOUNT_PRODUCTS_QUERY,
  {
    variables: {
      id: body.id,
    },
  },
);

const existingResult = await existingResponse.json();

const existingItems =
  existingResult.data.codeDiscountNode.codeDiscount.customerGets.items;

console.log(
  "Existing Shopify Items",
  JSON.stringify(existingItems, null, 2),
);

const input = buildUpdateInput({
  ...body,
  existingItems,
});

// console.log(
//   "Shopify Update Discount Input",
//   JSON.stringify(input, null, 2),
// );

  const response = await admin.graphql(
    UPDATE_DISCOUNT_MUTATION,
    {
      variables: {
        id: body.id,
        basicCodeDiscount: input,
      },
    },
  );

  const result = await response.json();

  // console.log(
  //   "Shopify Update Discount Response",
  //   JSON.stringify(result, null, 2),
  // );

  const payload =
    result?.data?.discountCodeBasicUpdate;

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
  };
}


export async function deleteShopifyDiscount(admin, shopifyDiscountId) {
  const response = await admin.graphql(
    DELETE_DISCOUNT_MUTATION,
    {
      variables: {
        id: shopifyDiscountId,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  const discountCodeDelete = result?.data?.discountCodeDelete;

  if (!discountCodeDelete) {
    throw new Error("Failed to delete Shopify discount.");
  }

  if (discountCodeDelete.userErrors.length > 0) {
    throw new Error(
      discountCodeDelete.userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return discountCodeDelete.deletedCodeDiscountId;
}