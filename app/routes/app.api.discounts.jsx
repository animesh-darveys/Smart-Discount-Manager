import { Prisma } from "@prisma/client";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { createShopifyDiscount } from "../services/shopify-discount.server";
import { updateShopifyDiscount } from "../services/shopify-discount.server";
import { deleteShopifyDiscount } from "../services/shopify-discount.server";
import { toCustomerGids } from "../utils/customer-ids.server";

import {
  activateShopifyDiscount,
  deactivateShopifyDiscount,
} from "../services/shopify-discount.server";

// Empty selection → database NULL.
function toJsonList(value) {
  return Array.isArray(value) && value.length > 0
    ? value
    : Prisma.DbNull;
}

function toCustomerIdsJson(body) {
  if (body.customerEligibility !== "specific_customers") {
    return Prisma.DbNull;
  }

  const customerIds = toCustomerGids(body.customerIds);

  return customerIds.length > 0 ? customerIds : Prisma.DbNull;
}

function buildDiscountData(body) {
  return {
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

    selectedProducts: toJsonList(body.selectedProducts),

    selectedCollections: toJsonList(body.selectedCollections),

    customerEligibility: body.customerEligibility,

    customerIds: toCustomerIdsJson(body),

    startDate: new Date(body.startDate),

    endDate:
      body.hasEndDate && body.endDate
        ? new Date(body.endDate)
        : null,

    usageLimit: body.usageLimit
      ? Number(body.usageLimit)
      : null,

    limitPerCustomer: Boolean(body.limitPerCustomer),

    status: body.status,
  };
}

async function assertCodeIsFree(discountCode, excludeId) {
  const existing = await prisma.discountOffer.findFirst({
    where: {
      discountCode,
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`Discount code "${discountCode}" already exists.`);
  }
}

export async function action({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const body = await request.json();

    // UPDATE
    if (body.mode === "edit") {

      const existingDiscount = await prisma.discountOffer.findFirst({
        where: {
          id: body.id,
          shop: session.shop,
        },
      });

      if (!existingDiscount) {
        throw new Error("Discount not found.");
      }

      if (!existingDiscount.shopifyDiscountId) {
        throw new Error("Discount is not linked to Shopify.");
      }

      const data = buildDiscountData(body);

      if (body.discountCode !== existingDiscount.discountCode) {
        await assertCodeIsFree(body.discountCode, existingDiscount.id);
      }

      await updateShopifyDiscount(admin, {
        ...body,
        id: existingDiscount.shopifyDiscountId,
        existingCustomerIds: existingDiscount.customerIds ?? [],
      });

      if (
        existingDiscount.status === "active" &&
        body.status === "draft"
      ) {
        await deactivateShopifyDiscount(
          admin,
          existingDiscount.shopifyDiscountId
        );
      }

      if (
        existingDiscount.status === "draft" &&
        body.status === "active"
      ) {
        await activateShopifyDiscount(
          admin,
          existingDiscount.shopifyDiscountId
        );
      }

      const discount = await prisma.discountOffer.update({
        where: {
          id: existingDiscount.id,
        },
        data,
      });

      return Response.json({
        success: true,
        data: discount,
      });
    }

    // DELETE
    if (body.mode === "delete") {

      const existingDiscount = await prisma.discountOffer.findFirst({
        where: {
          id: body.id,
          shop: session.shop,
        },
      });

      if (!existingDiscount) {
        throw new Error("Discount not found.");
      }

      if (existingDiscount.shopifyDiscountId) {
        await deleteShopifyDiscount(
          admin,
          existingDiscount.shopifyDiscountId
        );
      }

      await prisma.discountOffer.delete({
        where: {
          id: existingDiscount.id,
        },
      });

      return Response.json({
        success: true,
        message: "Discount deleted successfully.",
      });
    }

    // CREATE
    const data = buildDiscountData(body);

    await assertCodeIsFree(body.discountCode);

    const shopifyDiscount = await createShopifyDiscount(admin, body);

    // If anything after the Shopify create fails, remove the Shopify
    // discount so no live code is left without a DB record.
    try {
      if (body.status === "draft") {
        await deactivateShopifyDiscount(
          admin,
          shopifyDiscount.id
        );
      }

      const discount = await prisma.discountOffer.create({
        data: {
          ...data,
          shop: session.shop,
          shopifyDiscountId: shopifyDiscount.id,
        },
      });

      return Response.json({
        success: true,
        data: discount,
      });
    } catch (error) {
      try {
        await deleteShopifyDiscount(admin, shopifyDiscount.id);
      } catch (cleanupError) {
        console.error(
          `Failed to remove Shopify discount ${shopifyDiscount.id} after a failed save:`,
          cleanupError
        );
      }

      throw error;
    }
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
