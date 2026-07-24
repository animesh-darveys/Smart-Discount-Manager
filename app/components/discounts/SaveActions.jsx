import { PageActions } from "@shopify/polaris";

export default function SaveActions({
  loading = false,
  onCreate,
}) {
  return (
    <PageActions
      primaryAction={{
        content: "Create Discount",
        onAction: onCreate,
        loading,
      }}
    />
  );
}