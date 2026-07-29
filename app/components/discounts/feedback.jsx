import { Banner } from "@shopify/polaris";
import { useNavigate } from "react-router";

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