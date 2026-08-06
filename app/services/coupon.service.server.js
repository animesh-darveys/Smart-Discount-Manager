import { buildCashbackDiscountInput } from "../utils/cashback-discount-builder.server";

const CREATE_DISCOUNT_MUTATION = `
mutation discountCodeBasicCreate(
  $basicCodeDiscount: DiscountCodeBasicInput!
) {
  discountCodeBasicCreate(
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

function generateCouponCode() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `CASHBACK-${timestamp}${random}`;
}

export async function generateCoupon(admin, reward) {
  const couponCode = generateCouponCode();

  const input = buildCashbackDiscountInput(
    reward,
    couponCode
  );

  console.log(
    "Cashback Discount Input",
    JSON.stringify(input, null, 2)
  );

  const response = await admin.graphql(
    CREATE_DISCOUNT_MUTATION,
    {
      variables: {
        basicCodeDiscount: input,
      },
    }
  );

  const result = await response.json();

  console.log(
    "Cashback Discount Response",
    JSON.stringify(result, null, 2)
  );

  const payload =
    result?.data?.discountCodeBasicCreate;

  if (!payload) {
    throw new Error("Invalid Shopify response.");
  }

  if (payload.userErrors.length) {
    throw new Error(
      payload.userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return {
    discountOfferId:
      payload.codeDiscountNode.id,

    discountCode: couponCode,
  };
}