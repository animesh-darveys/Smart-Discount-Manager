import {
  Card,
  DataTable,
  Badge,
  Button,
  InlineStack,
  Pagination,
  Text,
  EmptyState,
} from "@shopify/polaris";

import { useMemo, useState } from "react";
import {
  useNavigate,
  useRevalidator,
} from "react-router";

import ConfirmDialog from "../discounts/ConfirmDialog";

import { deleteDiscountApi } from "../../services/discount.service";

import { toUpperCase } from "../../utils/string";

import { useAppBridge } from '@shopify/app-bridge-react';

export default function DiscountTable({
  discounts,
  page,
  totalPages,
}) {

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const shopify = useAppBridge();

  const navigate = useNavigate();
  const revalidator = useRevalidator();

  async function handleDelete() {

    setDeleteLoading(true);

    try {

      const response =
        await deleteDiscountApi(selectedDiscountId);

      if (!response.success) {
        throw new Error(response.message);
      }

      setDeleteModalOpen(false);

      shopify.toast.show(
        "Discount deleted successfully."
      );

      revalidator.revalidate();

    } catch (error) {

      shopify.toast.show(error.message, {
        isError: true,
      });

    } finally {

      setDeleteLoading(false);

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
          onClick={() => {
            setSelectedDiscountId(discount.id);
            setDeleteModalOpen(true);
          }}
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
      {discounts.length === 0 ? (
        <Card>
          <EmptyState
            heading="No discounts found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            action={{
              content: "Create Discount",
              onAction: () => navigate("/app/discounts/new"),
            }}
          >
            <p>
              You haven't created any discounts yet. Create your first discount
              to get started.
            </p>
          </EmptyState>
        </Card>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div style={{ marginTop: 16 }}>
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p">
                  Page {page} of {totalPages}
                </Text>

                <Pagination
                  hasPrevious={page > 1}
                  hasNext={page < totalPages}
                  onPrevious={() =>
                    navigate(`/app/discounts?page=${page - 1}`)
                  }
                  onNext={() =>
                    navigate(`/app/discounts?page=${page + 1}`)
                  }
                />
              </InlineStack>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteModalOpen}
        title="Delete Discount"
        message="Are you sure you want to delete this discount?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </>
  );

}