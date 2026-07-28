import { Card, BlockStack, Text } from "@shopify/polaris";

export default function Message() {
  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd" as="h2">
          Hello, World!
        </Text>

        <Text as="p">
          Welcome to your Remix React application.
        </Text>
      </BlockStack>
    </Card>
  );
}