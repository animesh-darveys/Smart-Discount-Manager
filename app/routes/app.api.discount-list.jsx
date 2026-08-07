import { authenticate } from "../shopify.server";
import { getAllDiscountOffers } from "../services/discount-offers.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);

    const discounts = await getAllDiscountOffers(session.shop);

    return Response.json({
      success: true,
      count: discounts.length,
      data: discounts,
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
      }
    );
  }
};