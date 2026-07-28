import { PageActions } from "@shopify/polaris";

export default function SaveActions({
  mode = "create",
  loading = false,
  onSubmit,
}) {
  return (
    <PageActions
      primaryAction={{
        content:
          mode === "edit"
            ? "Update Discount"
            : "Create Discount",
        onAction: onSubmit,
        loading,
      }}
    />
  );
}