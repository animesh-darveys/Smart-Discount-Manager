import prisma from "../db.server";

export async function action({ request }) {
  try {
    const body = await request.json();

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

        maximumDiscount: body.maximumDiscount
          ? Number(body.maximumDiscount)
          : null,

        appliesTo: body.appliesTo,
        selectedProducts: body.selectedProducts,
        selectedCollections: body.selectedCollections,

        customerEligibility: body.customerEligibility,
        customerIds: body.customerIds,
        customerTags: body.customerTags,

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