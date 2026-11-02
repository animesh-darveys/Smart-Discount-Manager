import { toCustomerGids } from "./customer-ids.server";

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

    customerGets: buildCustomerGets(body, false),

    ...(body.minimumPurchase && {
      minimumRequirement: buildMinimumRequirement(body),
    }),
  };
}

// Update input sends every field explicitly: an omitted field keeps its old
// value in Shopify, so cleared fields must be sent as null.
export function buildUpdateInput(body) {
  return {
    title: body.title,
    code: body.discountCode,

    startsAt: new Date(body.startDate).toISOString(),

    endsAt:
      body.hasEndDate && body.endDate
        ? new Date(body.endDate).toISOString()
        : null,

    appliesOncePerCustomer: body.limitPerCustomer,

    usageLimit: body.usageLimit ? Number(body.usageLimit) : null,

    context: buildContext(body, body.existingCustomerIds),

    customerGets: buildCustomerGets(body, true),

    minimumRequirement: body.minimumPurchase
      ? buildMinimumRequirement(body)
      : { subtotal: { greaterThanOrEqualToSubtotal: null } },
  };
}

function buildContext(body, existingCustomerIds = []) {
  switch (body.customerEligibility) {
    case "all_customer":
      return {
        all: "ALL",
      };

    case "specific_customers": {
      const customerIds = toCustomerGids(body.customerIds);

      if (customerIds.length === 0) {
        throw new Error("Enter at least one customer ID.");
      }

      const removedCustomerIds = toCustomerGids(
        existingCustomerIds ?? []
      ).filter((id) => !customerIds.includes(id));

      return {
        customers: {
          add: customerIds,
          ...(removedCustomerIds.length > 0 && {
            remove: removedCustomerIds,
          }),
        },
      };
    }

    default:
      throw new Error(
        `Invalid customer eligibility: ${body.customerEligibility}`
      );
  }
}

function buildCustomerGets(body, isUpdate = false) {
  return {
    value: buildDiscountValue(body),

    items: buildItems(body, isUpdate),
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

function buildItems(body, isUpdate = false) {

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
  Array.isArray(body.selectedProducts)
) {
  const newProducts = body.selectedProducts.map((product) =>
    typeof product === "string" ? product : product.id
  );

  // CREATE MODE
  if (!isUpdate) {
    return {
      products: {
        productsToAdd: newProducts,
      },
    };
  }

  // Existing Shopify Products
  const existingProducts =
    body.existingItems?.products?.nodes?.map((p) => p.id) || [];

  // Difference
  const productsToAdd = newProducts.filter(
    (id) => !existingProducts.includes(id)
  );

  const productsToRemove = existingProducts.filter(
    (id) => !newProducts.includes(id)
  );

  return {
    products: {
      productsToAdd: productsToAdd,
      productsToRemove: productsToRemove,
    },
  };
}

  // Selected Collections
  if (
  body.appliesTo === "collections" &&
  Array.isArray(body.selectedCollections)
) {
  const newCollections = body.selectedCollections.map((collection) =>
    typeof collection === "string" ? collection : collection.id
  );

  // CREATE MODE
  if (!isUpdate) {
    return {
      collections: {
        add: newCollections,
      },
    };
  }

  // Existing Shopify Collections
  const existingCollections =
    body.existingItems?.collections?.nodes?.map((c) => c.id) || [];

  // Difference
  const collectionsToAdd = newCollections.filter(
    (id) => !existingCollections.includes(id)
  );

  const collectionsToRemove = existingCollections.filter(
    (id) => !newCollections.includes(id)
  );

  return {
    collections: {
      add: collectionsToAdd,
      remove: collectionsToRemove,
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