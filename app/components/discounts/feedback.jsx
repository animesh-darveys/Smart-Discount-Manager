import { Banner } from "@shopify/polaris";
import { useNavigate } from "react-router";
import PropTypes from "prop-types";
export function BannerExample({ mode }) {
  const navigate = useNavigate();

  return (
    <Banner
      title={`Your Discount has been ${mode === "edit" ? "updated" : "created"}.`}
      tone="success"
      onDismiss={() => navigate("/app/discounts")}
      action={{
        content: "Go to Discounts",
        onAction: () => navigate("/app/discounts"),
      }}
    />
  );
}
BannerExample.propTypes = {
  mode: PropTypes.string.isRequired,
};