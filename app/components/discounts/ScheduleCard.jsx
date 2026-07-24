import {
  BlockStack,
  Card,
  Checkbox,
  Text,
  TextField,
  InlineGrid
} from "@shopify/polaris";

export default function ScheduleCard({
  startDate,
  endDate,
  hasEndDate,
  onStartDateChange,
  onEndDateChange,
  onHasEndDateChange,
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Schedule
        </Text>
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={onStartDateChange}
            autoComplete="off"
          />



          {hasEndDate && (
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={onEndDateChange}
              autoComplete="off"
            />
          )}
        </InlineGrid>
        <Checkbox
          label="Set end date"
          checked={hasEndDate}
          onChange={onHasEndDateChange}
        />
      </BlockStack>
    </Card>
  );
}