import { PageActions } from "@shopify/polaris";
import PropTypes from "prop-types";

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
SaveActions.propTypes = {
  mode: PropTypes.string,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
};