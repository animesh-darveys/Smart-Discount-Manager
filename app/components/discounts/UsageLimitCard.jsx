import {
  BlockStack,
  Card,
  Checkbox,
  Text,
  TextField,
} from "@shopify/polaris";

export default function UsageLimitCard({
  usageLimit,
  limitPerCustomer,
  onUsageLimitChange,
  onLimitPerCustomerChange,
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Usage Limits
        </Text>

        <TextField
          label="Total Usage Limit"
          type="text"
          value={usageLimit}
          onChange={(value) => {
            if (value === "" || /^[1-9]\d*$/.test(value)) {
              onUsageLimitChange(value);
            }
          }}
          autoComplete="off"
          inputMode="numeric"
          placeholder="Unlimited"
          helpText="Leave empty to allow unlimited uses."
        />

        <Checkbox
          label="Limit to one use per customer"
          checked={limitPerCustomer}
          onChange={onLimitPerCustomerChange}
          helpText="Each eligible customer can redeem this discount only once."
        />
      </BlockStack>
    </Card>
  );
}