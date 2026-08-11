import {
  Card,
  BlockStack,
  TextField,
  Text,
} from "@shopify/polaris";
import PropTypes from "prop-types";
export default function DiscountGeneralCard({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
  mode
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
        <Text>{mode}</Text>
      </BlockStack>
    </Card>
  );
}
DiscountGeneralCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,

  errors: PropTypes.shape({
    title: PropTypes.string,
  }).isRequired,

  mode: PropTypes.string.isRequired,
};