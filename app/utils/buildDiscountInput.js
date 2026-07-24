export function buildDiscountInput(body) {
  const input = {
    title: body.title,
    code: body.discountCode,

    startsAt: new Date(body.startDate).toISOString(),

    customerSelection: {
      all: body.customerEligibility === "all",
    },

    appliesOncePerCustomer: body.limitPerCustomer,
  };

  // End Date
  if (body.hasEndDate && body.endDate) {
    input.endsAt = new Date(body.endDate).toISOString();
  }

  // Usage Limit
  if (body.usageLimit) {
    input.usageLimit = Number(body.usageLimit);
  }

  // Minimum Purchase
  if (body.minimumPurchase) {
    input.minimumRequirement = {
      subtotal: {
        greaterThanOrEqualToSubtotal: Number(body.minimumPurchase),
      },
    };
  }

  // Discount Value
  let value;

  if (body.discountType === "PERCENTAGE") {
    value = {
      percentage: Number(body.discountValue) / 100,
    };
  } else {
    value = {
      discountAmount: {
        amount: Number(body.discountValue),
        appliesOnEachItem: false,
      },
    };
  }

  // Applies To
  let items = {
    all: true,
  };

  // Selected Products
  if (
    body.appliesTo === "PRODUCTS" &&
    body.selectedProducts?.length
  ) {
    items = {
      products: {
        productsToAdd: body.selectedProducts,
      },
    };
  }

  // Selected Collections
  if (
    body.appliesTo === "COLLECTIONS" &&
    body.selectedCollections?.length
  ) {
    items = {
      collections: {
        collectionsToAdd: body.selectedCollections,
      },
    };
  }

  input.customerGets = {
    value,
    items,
  };

  return input;
}