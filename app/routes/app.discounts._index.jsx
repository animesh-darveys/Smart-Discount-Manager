import { Page } from "@shopify/polaris";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getDiscounts } from "../services/discount.server";
import DiscountTable from "../components/discounts/DiscountTable";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || 1);

  return await getDiscounts({
    page,
    limit: 8,
  });
};

export default function DiscountsPage() {
  const { discounts, page, totalPages } = useLoaderData();

  return (
    <>
    <Page title="Discounts">
      <DiscountTable
        discounts={discounts}
        page={page}
        totalPages={totalPages}
      />
    </Page>
    </>
  );
}