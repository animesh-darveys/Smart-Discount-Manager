import {
  Card,
  DataTable,
  Badge,
  Button,
  InlineStack,
  Pagination,
  Text,
} from "@shopify/polaris";

import { useMemo } from "react";
import { useNavigate } from "react-router";
import { toTitleCase } from "../../utils/string";

export default function DiscountTable({
  discounts,
  page,
  totalPages,
}) {

  const navigate = useNavigate();

  const rows = useMemo(() => {

    return discounts.map((discount) => [

      <Text
        key={discount.id}
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
        tone={discount.status === "active"
          ? "success"
          : "info"}
      >
        {toTitleCase(discount.status)}
      </Badge>,

      <InlineStack
        key={`actions-${discount.id}`}
        gap="200"
      >

        <Button
          variant="secondary"
          tone="critical"
        >
          Delete
        </Button>

        <Button
          onClick={() =>
            navigate(`/app/discounts/${discount.id}/edit`)
          }
        >
          Update
        </Button>

      </InlineStack>

    ]);

  }, [discounts]);

  return (
    <>
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
          <InlineStack align="space-between" blockAlign="center">
            <Text as="p" variant="bodyMd" tone="subdued">
              Page {page} of {totalPages}
            </Text>

            <Pagination
              hasPrevious={page > 1}
              hasNext={page < totalPages}
              onPrevious={() => navigate(`/app/discounts?page=${page - 1}`)}
              onNext={() => navigate(`/app/discounts?page=${page + 1}`)}
            />
          </InlineStack>
        </div>
      )}
    </>
  );

}