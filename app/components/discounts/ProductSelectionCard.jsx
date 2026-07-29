import {
  BlockStack,
  Button,
  Card,
  ChoiceList,
  InlineStack,
  Text,
  Box,
  Thumbnail,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";

export default function ProductSelectionCard({
  appliesTo,
  selectedProducts,
  selectedCollections,
  onAppliesToChange,
  onSelectProducts,
  onSelectCollections,
  onRemoveProduct,
  onRemoveCollection,
  onResetProducts,
  onResetCollections,
}) {
  // Automatically open picker when eligibility changes
const handleEligibilityChange = async (value) => {
  const selected = value[0];

  if (selected === appliesTo) return;

  onAppliesToChange(selected);

  if (selected === "products") {
    await onSelectProducts();
  } else {
    await onSelectCollections();
  }
};

  const renderResource = (item, onRemove) => (
    <Box
      key={item.id}
      padding="300"
      borderWidth="025"
      borderColor="border"
      borderRadius="200"
    >
      <InlineStack align="space-between" blockAlign="center">
        <InlineStack gap="300" blockAlign="center">
          <Thumbnail
            source={
              item.image ||
              "https://cdn.shopify.com/s/images/admin/no-image-large.svg"
            }
            alt={item.title}
            size="small"
          />

          <BlockStack gap="050">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {item.title}
            </Text>

            {item.vendor && (
              <Text as="p" variant="bodySm" tone="subdued">
                {item.vendor}
              </Text>
            )}
          </BlockStack>
        </InlineStack>

        <Button
          variant="tertiary"
          icon={DeleteIcon}
          onClick={() => onRemove(item.id)}
        />
      </InlineStack>
    </Box>
  );

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Product Eligibility
        </Text>

        <ChoiceList
          title="Apply Discount On"
          choices={[
            { label: "Specific Products", value: "products" },
            { label: "Specific Collections", value: "collections" },
          ]}
          selected={[appliesTo]}
          onChange={handleEligibilityChange}
        />

        {appliesTo === "products" && (
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd">
                Selected Products ({selectedProducts.length})
              </Text>

              <Button variant="primary" onClick={onSelectProducts}>
                Select Products
              </Button>
            </InlineStack>

            {selectedProducts.length > 0 ? (
              <BlockStack gap="200">
                {selectedProducts.map((product) =>
                  renderResource(product, onRemoveProduct)
                )}
              </BlockStack>
            ) : (
              <Text tone="subdued">No products selected.</Text>
            )}
          </BlockStack>
        )}

        {appliesTo === "collections" && (
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="bodyMd">
                Selected Collections ({selectedCollections.length})
              </Text>

              <Button variant="primary" onClick={onSelectCollections}>
                Select Collections
              </Button>
            </InlineStack>

            {selectedCollections.length > 0 ? (
              <BlockStack gap="200">
                {selectedCollections.map((collection) =>
                  renderResource(collection, onRemoveCollection)
                )}
              </BlockStack>
            ) : (
              <Text tone="subdued">No collections selected.</Text>
            )}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}