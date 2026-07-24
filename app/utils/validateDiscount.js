export function validateDiscount(data) {
  const errors = {};

  if (!data.title.trim()) {
    errors.title = "Coupon title is required.";
  }

  if (!data.discountCode.trim()) {
    errors.discountCode = "Discount code is required.";
  }

  if (!data.discountValue || Number(data.discountValue) <= 0) {
    errors.discountValue = "Enter a valid discount value.";
  }

  if (
    data.minimumPurchase &&
    Number(data.minimumPurchase) < 0
  ) {
    errors.minimumPurchase = "Minimum purchase cannot be negative.";
  }

  if (
    data.maximumDiscount &&
    Number(data.maximumDiscount) <= 0
  ) {
    errors.maximumDiscount = "Enter a valid maximum discount.";
  }

  if (!data.startDate) {
    errors.startDate = "Start date is required.";
  }

  if (
    data.hasEndDate &&
    !data.endDate
  ) {
    errors.endDate = "End date is required.";
  }

  if (
    data.hasEndDate &&
    data.startDate &&
    data.endDate &&
    new Date(data.endDate) <= new Date(data.startDate)
  ) {
    errors.endDate = "End date must be after start date.";
  }

  if (
    data.usageLimit &&
    Number(data.usageLimit) <= 0
  ) {
    errors.usageLimit = "Usage limit must be greater than 0.";
  }

  if (
    data.appliesTo === "products" &&
    data.selectedProducts.length === 0
  ) {
    errors.products = "Select at least one product.";
  }

  if (
    data.appliesTo === "collections" &&
    data.selectedCollections.length === 0
  ) {
    errors.collections = "Select at least one collection.";
  }

  if (
    data.customerEligibility === "customers" &&
    !data.customerIds.trim()
  ) {
    errors.customerIds = "Enter customer IDs.";
  }

  if (
    data.customerEligibility === "tags" &&
    !data.customerTags.trim()
  ) {
    errors.customerTags = "Enter customer tags.";
  }

  return errors;
}