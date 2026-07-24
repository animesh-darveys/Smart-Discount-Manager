import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();

    const mutation = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
      `;
const variables = {
  basicCodeDiscount: {
    title: body.title,
    code: body.discountCode,

    startsAt: new Date(body.startDate).toISOString(),

    customerSelection: {
      all: true,
    },

    customerGets: {
      items: {
        all: true,
      },

      value: {
        percentage: Number(body.discountValue) / 100,
      },
    },
  },
};

const response = await admin.graphql(mutation, {
  variables,
});

const result = await response.json();

console.log(result);
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
        customerIds: [body.customerIds],

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