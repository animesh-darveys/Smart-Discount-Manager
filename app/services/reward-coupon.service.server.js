import { buildCashbackDiscountInput } from "../utils/reward-discount-builder.server";

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
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `DARCSB${timestamp}${random}`;
}

export async function generateCoupon(admin, discountData) {
  const couponCode = generateCouponCode();

  const input = buildCashbackDiscountInput(
    discountData,
    couponCode
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

  const payload =
    result?.data?.discountCodeBasicCreate;

  if (!payload) {
    throw new Error("Invalid Shopify response.");
  }

  if (payload.userErrors?.length) {
    throw new Error(
      payload.userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  if (!payload.codeDiscountNode?.id) {
    throw new Error(
      "Shopify discount was created but discount ID was not returned."
    );
  }

  return {
    shopifyDiscountId: payload.codeDiscountNode.id,
    discountCode: couponCode,
    startDate: input.startsAt,
    endDate: input.endsAt,
  };
}