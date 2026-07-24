import {
  Card,
  BlockStack,
  Text,
  TextField,
  InlineGrid,
  Select,
} from "@shopify/polaris";

export default function DiscountConfigurationCard({
  discountCode,
  discountType,
  discountValue,
  minimumPurchase,
  maximumDiscount,
  onDiscountCodeChange,
  onDiscountTypeChange,
  onDiscountValueChange,
  onMinimumPurchaseChange,
  onMaximumDiscountChange,
  errors
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Discount Configuration
        </Text>

        <TextField
          label="Discount Code"
          value={discountCode}
          onChange={onDiscountCodeChange}
          placeholder="SAVE20"
          autoComplete="off"
          error={errors.discountCode}
        />
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">

          <Select
            label="Discount Type"
            value={discountType}
            onChange={onDiscountTypeChange}
            options={[
              {
                label: "Percentage",
                value: "PERCENTAGE",
              },
              {
                label: "Fixed Amount",
                value: "FIXED_AMOUNT",
              },
              {
                label: "Free Shipping",
                value: "FREE_SHIPPING",
              },
            ]}
          />

          {discountType !== "FREE_SHIPPING" && (
            <TextField
              label={
                discountType === "PERCENTAGE"
                  ? "Discount Percentage"
                  : "Discount Amount"
              }
              type="text"
              inputMode="decimal"
              value={discountValue}
              onChange={(value) => {
                // Sirf positive decimal numbers allow
                if (/^\d*\.?\d*$/.test(value)) {
                  onDiscountValueChange(value);
                }
              }}
              suffix={discountType === "PERCENTAGE" ? "%" : "₹"}
              autoComplete="off"
              error={errors.discountValue}
            />
          )}

          <TextField
            label="Minimum Purchase"
            type="text"
            inputMode="decimal"
            value={minimumPurchase}
            onChange={(value) => {
              if (/^\d*\.?\d*$/.test(value)) {
                onMinimumPurchaseChange(value);
              }
            }}
            prefix="GBP"
            autoComplete="off"
          />

          {discountType === "PERCENTAGE" && (
            <TextField
              label="Maximum Discount"
              type="number"
              value={maximumDiscount}
              onChange={onMaximumDiscountChange}
              prefix="GBP"
              autoComplete="off"
            />
          )}
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}