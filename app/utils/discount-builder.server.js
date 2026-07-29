export function buildCreateInput(body) {
  return {
    title: body.title,
    code: body.discountCode,

    startsAt: new Date(body.startDate).toISOString(),

    ...(body.hasEndDate &&
      body.endDate && {
        endsAt: new Date(body.endDate).toISOString(),
      }),

    appliesOncePerCustomer: body.limitPerCustomer,

    ...(body.usageLimit && {
      usageLimit: Number(body.usageLimit),
    }),

    context: buildContext(body),

    customerGets: buildCustomerGets(body),

    ...(body.minimumPurchase && {
      minimumRequirement: buildMinimumRequirement(body),
    }),
  };
}

function buildContext(body) {
  switch (body.customerEligibility) {
    case "all_customer":
      return {
        all: "ALL",
      };

    case "specific_customers":
      return {
        customers: {
          add: Array.isArray(body.customerIds)
            ? body.customerIds
            : [body.customerIds],
        },
      };

    default:
      throw new Error(
        `Invalid customer eligibility: ${body.customerEligibility}`
      );
  }
}

function buildCustomerGets(body) {
  return {
    value: buildDiscountValue(body),

    items: buildItems(body),

    appliesOnOneTimePurchase: true,

    appliesOnSubscription: false,
  };
}

function buildDiscountValue(body) {
  if (body.discountType === "PERCENTAGE") {
    return {
      percentage: Number(body.discountValue) / 100,
    };
  }

  return {
    discountAmount: {
      amount: Number(body.discountValue),
      appliesOnEachItem: false,
    },
  };
}

function buildItems(body) {

  // Order discounts apply to the whole order.
  if (body.discountCategory === "order") {
    return {
      all: true,
    };
  }
  // All Products
  if (body.appliesTo === "all") {
    return {
      all: true,
    };
  }

  // Selected Products
  if (
    body.appliesTo === "products" &&
    Array.isArray(body.selectedProducts) &&
    body.selectedProducts.length > 0
  ) {
    return {
      products: {
        productsToAdd: body.selectedProducts.map((product) =>
          typeof product === "string" ? product : product.id
        ),
      },
    };
  }

  // Selected Collections
  if (
    body.appliesTo === "collections" &&
    Array.isArray(body.selectedCollections) &&
    body.selectedCollections.length > 0
  ) {
    return {
      collections: {
        add: body.selectedCollections.map((collection) =>
          typeof collection === "string" ? collection : collection.id
        ),
      },
    };
  }

  throw new Error("Invalid appliesTo selection.");
}

function buildMinimumRequirement(body) {
  return {
    subtotal: {
      greaterThanOrEqualToSubtotal: Number(body.minimumPurchase),
    },
  };
}

// Reuse the same builder for update
export function buildUpdateInput(body) {
  return buildCreateInput(body);
}