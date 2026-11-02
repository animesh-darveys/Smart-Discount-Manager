import {
  BlockStack,
  Card,
  ChoiceList,
  Text,
  TextField,
} from "@shopify/polaris";
import PropTypes from "prop-types";

export default function CustomerEligibilityCard({
  mode = "create",
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
              value: "all_customer",
            },
            {
              label: "Specific Customers",
              value: "specific_customers",
            }
          ].filter(
            (choice) => mode !== "edit" || choice.value === customerEligibility
          )}
          selected={[customerEligibility]}
          onChange={handleEligibilityChange}
          disabled={mode === "edit"}
        />

        {customerEligibility === "specific_customers" && (
          <TextField
            label="Customer IDs"
            value={customerIds}
            onChange={onCustomerIdsChange}
            autoComplete="off"
            placeholder={`gid://shopify/Customer/123456789`}
            helpText="Customer IDs or GIDs, separated by commas"
          />
        )}
      </BlockStack>
    </Card>
  );
}

CustomerEligibilityCard.propTypes = { customerEligibility: PropTypes.string.isRequired, customerIds: PropTypes.string.isRequired, onEligibilityChange: PropTypes.func.isRequired, onCustomerIdsChange: PropTypes.func.isRequired, mode: PropTypes.string, };