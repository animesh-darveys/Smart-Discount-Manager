import {
  BlockStack,
  Card,
  ChoiceList,
  Text,
} from "@shopify/polaris";

export default function StatusCard({
  status,
  onStatusChange,
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Status
        </Text>

        <ChoiceList
          title="Discount Status"
          choices={[
            {
              label: "Active",
              value: "active",
            },
            {
              label: "Draft",
              value: "draft",
            },
          ]}
          selected={[status]}
          onChange={(value) => onStatusChange(value[0])}
        />
      </BlockStack>
    </Card>
  );
}