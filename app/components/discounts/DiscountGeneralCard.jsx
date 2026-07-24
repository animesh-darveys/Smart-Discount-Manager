import {
  Card,
  BlockStack,
  TextField,
  Text,
} from "@shopify/polaris";

export default function DiscountGeneralCard({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          General Information
        </Text>

        <TextField
          label="Coupon Title"
          placeholder="Summer Sale 20%"
          value={title}
          onChange={onTitleChange}
          autoComplete="off"
          error={errors.title}
        />

        <TextField
          label="Description"
          placeholder="Enter discount description here"
          multiline={3}
          value={description}
          onChange={onDescriptionChange}
          autoComplete="off"
        />
      </BlockStack>
    </Card>
  );
}