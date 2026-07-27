import { useLoaderData, useNavigate } from "react-router";
import { useMemo } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getDiscounts } from "../services/discount.server";
import { toTitleCase } from "../utils/string";

import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  InlineStack,
  Text,
  Pagination,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || 1);

  const data = await getDiscounts({
    page,
    limit: 50,
  });

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return {
    ...data,
    discounts: data.discounts.map((discount) => ({
      ...discount,
      formattedCreatedAt: formatter.format(new Date(discount.createdAt)),
    })),
  };
};

export default function Index() {
  const navigate = useNavigate();

  const { discounts, page, totalPages } = useLoaderData();

  const rows = useMemo(
    () =>
      discounts.map((discount) => [
        <Text
          key={`title-${discount.id}`}
          as="span"
          variant="bodyMd"
          fontWeight="semibold"
        >
          {toTitleCase(discount.title)}
        </Text>,

        toTitleCase(discount.discountCode),

        `Amount Off ${toTitleCase(discount.discountCategory)}`,

        discount.formattedCreatedAt,

        <Badge
          key={`status-${discount.id}`}
          tone={discount.status === "active" ? "success" : "info"}
        >
          {toTitleCase(discount.status)}
        </Badge>,

        <InlineStack key={`actions-${discount.id}`} gap="200">
          <Button
            variant="secondary"
            tone="critical"
            onClick={() => console.log("Delete", discount.id)}
          >
            Delete
          </Button>

          <Button
            variant="primary"
            onClick={() =>
              navigate(`/app/discounts/${discount.id}/edit`)
            }
          >
            Update
          </Button>
        </InlineStack>,
      ]),
    [discounts, navigate]
  );

  return (
    <Page
      title="Smart Discount Manager"
      primaryAction={{
        content: "Create Discount",
        onAction: () => navigate("/app/discounts/new"),
      }}
    >
      <Card>
        <DataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Title",
            "Code",
            "Type",
            "Created",
            "Status",
            "Actions",
          ]}
          rows={rows}
        />
      </Card>

      {totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <Pagination
            hasPrevious={page > 1}
            hasNext={page < totalPages}
            onPrevious={() => navigate(`/app?page=${page - 1}`)}
            onNext={() => navigate(`/app?page=${page + 1}`)}
          />
        </div>
      )}
    </Page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);