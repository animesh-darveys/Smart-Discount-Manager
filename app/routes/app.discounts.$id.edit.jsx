import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getDiscountById } from "../services/discount.server";

export async function loader({ request, params }) {
  await authenticate.admin(request);

  const discount = await getDiscountById(params.id);

  if (!discount) {
    throw new Response("Discount not found", { status: 404 });
  }

  return { discount };
}