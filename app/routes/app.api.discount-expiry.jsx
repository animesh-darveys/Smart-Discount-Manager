import { authenticate } from "../shopify.server";
import { expireDiscounts } from "../services/discount-expiry.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const result = await expireDiscounts(
    admin,
    session.shop
  );

  return Response.json(result);
};