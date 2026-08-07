import {
  Card,
  DataTable,
  Badge,
  Button,
  InlineStack,
  Pagination,
  Text,
} from "@shopify/polaris";

import { useMemo, useState  } from "react";
import {
  useNavigate,
  useRevalidator,
} from "react-router";

import { deleteDiscountApi } from "../../services/discount.service";

import { toUpperCase } from "../../utils/string";

import {useAppBridge} from '@shopify/app-bridge-react';

export default function DiscountTable({
  discounts,
  page,
  totalPages,
}) {

  const shopify = useAppBridge();

  const navigate = useNavigate();
  const revalidator = useRevalidator();

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this discount?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteDiscountApi(id);

      if (!response.success) {
        throw new Error(response.message);
      }

      shopify.toast.show("Discount deleted successfully.");

      revalidator.revalidate();

      // Refresh the current page
      // window.location.reload();

      // Ya agar tum redirect karna chaho:
      // navigate("/app/discounts");
    } catch (error) {
      shopify.toast.show(error.message, {
        isError: true,
      });
    }
  }

  const rows = useMemo(() => {

    return discounts.map((discount) => [

      <Text
        key={discount.id}
        as="span"
        variant="bodyMd"
        fontWeight="semibold"
      >
        {toUpperCase(discount.title)}
      </Text>,

      toUpperCase(discount.discountCode),

      `AMOUNT OFF ${toUpperCase(discount.discountCategory)}`,

      discount.formattedCreatedAt,

      <Badge
        key={`status-${discount.id}`}
        tone={discount.status === "active"
          ? "success"
          : "info"}
      >
        {toUpperCase(discount.status)}
      </Badge>,

      <InlineStack
        key={`actions-${discount.id}`}
        gap="200"
      >

        <Button
          variant="secondary"
          tone="critical"
          onClick={() => handleDelete(discount.id)}
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