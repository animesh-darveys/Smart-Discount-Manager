export function buildCashbackDiscountInput(reward, couponCode) {
  const startsAt = new Date();

  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 60);

  return {
    title: `Cashback Reward - ${reward.orderName}`,

    code: couponCode,

    startsAt: startsAt.toISOString(),

    endsAt: endsAt.toISOString(),

    appliesOncePerCustomer: true,

    usageLimit: 1,

    context: buildContext(reward),

    customerGets: buildCustomerGets(reward),

    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
  };
}

function buildContext(reward) {
  return {
    customers: {
      add: [reward.customerId],
    },
  };
}

function buildCustomerGets(reward) {
  return {
    value: buildDiscountValue(reward),

    items: {
      all: true,
    },

    appliesOnOneTimePurchase: true,

    appliesOnSubscription: false,
  };
}

function buildDiscountValue(reward) {
  return {
    discountAmount: {
      amount: Number(reward.cashbackAmount),

      appliesOnEachItem: false,
    },
  };
}