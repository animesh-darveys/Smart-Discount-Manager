export function buildCashbackDiscountInput(
  discountData,
  couponCode
) {
  const startsAt = new Date();
  const couponValidityDays = Number(discountData.couponValidityDays);

  if (!Number.isFinite(couponValidityDays) || couponValidityDays <= 0  ) {
    throw new Error("Invalid coupon validity days");
  }

  const endsAt = new Date(startsAt);

  endsAt.setDate(endsAt.getDate() + couponValidityDays);

  return {
    title: `Cashback Reward - ${discountData.orderName}`,

    code: couponCode,

    startsAt: startsAt.toISOString(),

    endsAt: endsAt.toISOString(),

    appliesOncePerCustomer: true,

    usageLimit: 1,

    context: buildContext(discountData),

    customerGets: buildCustomerGets(discountData),

    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
  };
}

function buildContext(discountData) {
  return {
    customers: {
      add: [discountData.customerId],
    },
  };
}

function buildCustomerGets(discountData) {
  return {
    value: buildDiscountValue(discountData),

    items: {
      all: true,
    },
  };
}

function buildDiscountValue(discountData) {
  return {
    discountAmount: {
      amount: Number(discountData.cashbackAmount),

      appliesOnEachItem: false,
    },
  };
}