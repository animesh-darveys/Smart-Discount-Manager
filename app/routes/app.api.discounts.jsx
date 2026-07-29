import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createShopifyDiscount, updateShopifyDiscount, } from "../services/shopify-discount.server";

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();

    // UPDATE (Database only)
    if (body.mode === "edit") {

      const existingDiscount = await prisma.discountOffer.findUnique({
  where: {
    id: body.id,
  },
});

console.log("Prisma Discount:", existingDiscount);
console.log("Shopify Discount ID:", existingDiscount.shopifyDiscountId);
console.log(existingDiscount.shopifyDiscountId);

      if (!existingDiscount) {
        throw new Error("Discount not found.");
      }

      const shopifyResult = await updateShopifyDiscount(
        admin,
        existingDiscount.shopifyDiscountId,
        body
      );

      if (shopifyResult.userErrors.length) {
        return Response.json(
          {
            success: false,
            errors: shopifyResult.userErrors,
          },
          {
            status: 400,
          }
        );
      }

      const discount = await prisma.discountOffer.update({
        where: {
          id: body.id,
        },
        data: {
          title: body.title,
          description: body.description,

          discountCategory: body.discountCategory,

          discountCode: body.discountCode,

          discountType: body.discountType,

          discountValue: Number(body.discountValue),

          minimumPurchase: body.minimumPurchase
            ? Number(body.minimumPurchase)
            : null,

          appliesTo: body.appliesTo,

          selectedProducts: body.selectedProducts,

          selectedCollections: body.selectedCollections,

          customerEligibility: body.customerEligibility,

          customerIds: body.customerIds
            ? [body.customerIds]
            : [],

          startDate: new Date(body.startDate),

          endDate:
            body.hasEndDate && body.endDate
              ? new Date(body.endDate)
              : null,

          usageLimit: body.usageLimit
            ? Number(body.usageLimit)
            : null,

          limitPerCustomer: body.limitPerCustomer,

          status: body.status,
        },
      });

      return Response.json({
        success: true,
        data: discount,
      });
    }

    // CREATE
    const shopifyDiscount = await createShopifyDiscount(admin, body);

    const discount = await prisma.discountOffer.create({
      data: {
        title: body.title,
        description: body.description,

        discountCategory: body.discountCategory,

        discountCode: body.discountCode,

        discountType: body.discountType,

        discountValue: Number(body.discountValue),

        minimumPurchase: body.minimumPurchase
          ? Number(body.minimumPurchase)
          : null,

        appliesTo: body.appliesTo,

        selectedProducts: body.selectedProducts,

        selectedCollections: body.selectedCollections,

        customerEligibility: body.customerEligibility,

        customerIds: body.customerIds
          ? [body.customerIds]
          : [],

        startDate: new Date(body.startDate),

        endDate:
          body.hasEndDate && body.endDate
            ? new Date(body.endDate)
            : null,

        usageLimit: body.usageLimit
          ? Number(body.usageLimit)
          : null,

        limitPerCustomer: body.limitPerCustomer,

        status: body.status,

        shopifyDiscountId: shopifyDiscount.id,
      },
    });

    return Response.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}