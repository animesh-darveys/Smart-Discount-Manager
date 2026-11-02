import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useLoaderData } from "react-router";

import prisma from "../db.server";
import DiscountTable from "../components/discounts/DiscountTable";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const discounts = await prisma.discountOffer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedDiscounts = discounts.map((discount) => ({
    ...discount,
    formattedCreatedAt: new Date(
      discount.createdAt,
    ).toLocaleDateString(),
  }));

  return {
    discounts: formattedDiscounts,
    page: 1,
    totalPages: 1,
  };
};

export default function Index() {
  const { discounts, page, totalPages } = useLoaderData();

  return (
    <s-page heading="Smart Discount Manager List">
        <DiscountTable
          discounts={discounts}
          page={page}
          totalPages={totalPages}
        />
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};