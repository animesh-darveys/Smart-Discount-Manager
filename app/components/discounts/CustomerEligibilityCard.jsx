import {
  BlockStack,
  Card,
  ChoiceList,
  Text,
  TextField,
} from "@shopify/polaris";

export default function CustomerEligibilityCard({
  customerEligibility,
  customerIds,
  onEligibilityChange,
  onCustomerIdsChange,
}) {
  const handleEligibilityChange = (value) => {
    onEligibilityChange(value[0]);
  };

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Customer Eligibility
        </Text>

        <ChoiceList
          title="Who can use this discount?"
          choices={[
            {
              label: "All Customers",
              value: "all",
            },
            {
              label: "Specific Customers",
              value: "customers",
            }
          ]}
          selected={[customerEligibility]}
          onChange={handleEligibilityChange}
        />

        {customerEligibility === "customers" && (
          <TextField
            label="Customer IDs"
            value={customerIds}
            onChange={onCustomerIdsChange}
            autoComplete="off"
            placeholder={`gid://shopify/Customer/123456789`}
            helpText="Enter Shopify Customer GID"
          />
        )}
      </BlockStack>
    </Card>
  );
}