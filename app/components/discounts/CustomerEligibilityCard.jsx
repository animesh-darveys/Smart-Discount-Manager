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
  customerTags,
  onEligibilityChange,
  onCustomerIdsChange,
  onCustomerTagsChange,
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
            },
            {
              label: "Customer Tags",
              value: "tags",
            },
            {
              label: "New Customers",
              value: "new",
            },
            {
              label: "Returning Customers",
              value: "returning",
            },
          ]}
          selected={[customerEligibility]}
          onChange={handleEligibilityChange}
        />

        {customerEligibility === "customers" && (
          <TextField
            label="Customer IDs"
            value={customerIds}
            onChange={onCustomerIdsChange}
            multiline={4}
            autoComplete="off"
            placeholder={`gid://shopify/Customer/123456789\ngid://shopify/Customer/987654321`}
            helpText="Enter one Shopify Customer GID per line."
          />
        )}

        {customerEligibility === "tags" && (
          <TextField
            label="Customer Tags"
            value={customerTags}
            onChange={onCustomerTagsChange}
            autoComplete="off"
            placeholder="VIP, GOLD, WHOLESALE"
            helpText="Separate multiple tags using commas."
          />
        )}

        {customerEligibility === "new" && (
          <Text tone="subdued">
            This discount will only be available to customers placing their first order.
          </Text>
        )}

        {customerEligibility === "returning" && (
          <Text tone="subdued">
            This discount will only be available to returning customers.
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}