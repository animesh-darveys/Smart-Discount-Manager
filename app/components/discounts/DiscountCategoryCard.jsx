import { Card, ChoiceList, BlockStack, Text } from "@shopify/polaris";
import PropTypes from "prop-types";

export default function DiscountCategoryCard({
  discountCategory,
  onCategoryChange,
  mode
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Discount Category
        </Text>

        <ChoiceList
          title="Select discount category"
          selected={[discountCategory]}
          onChange={(value) => onCategoryChange(value[0])}
          disabled={mode === "edit"}
          choices={[
            {
              label: "Amount Off Order",
              value: "order",
            },
            {
              label: "Amount Off Products",
              value: "product",
            },
          ].filter(
            (choice) => mode !== "edit" || choice.value === discountCategory
          )}
        />
      </BlockStack>
    </Card>
  );
}
DiscountCategoryCard.propTypes = { discountCategory: PropTypes.string.isRequired, onCategoryChange: PropTypes.func.isRequired, mode: PropTypes.string.isRequired, };