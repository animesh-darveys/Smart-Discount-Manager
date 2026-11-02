import { useState } from "react";

import {
  Page,
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Divider,
  Banner,
} from "@shopify/polaris";

import {
  Form,
  useLoaderData,
  useActionData,
} from "react-router";

import { authenticate } from "../shopify.server";

import {
  getShopSettings,
  saveShopSettings,
} from "../services/settings.service.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const result = await getShopSettings(admin);

  return result;
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();

  const settings = {
    defaultDiscountType:
      formData.get("defaultDiscountType"),

    defaultDiscountStatus:
      formData.get("defaultDiscountStatus"),

    defaultDiscountCategory:
      formData.get("defaultDiscountCategory"),

    minimumPurchase:
      formData.get("minimumPurchase"),

    cashbackPercentage:
      formData.get("cashbackPercentage"),

    rewardEligibilityDays:
      formData.get("rewardEligibilityDays"),

    rewardGracePeriodDays:
      formData.get("rewardGracePeriodDays"),

    couponValidityDays:
      formData.get("couponValidityDays"),
  };

  try {
    const { shopId } = await getShopSettings(admin);

    await saveShopSettings(
      admin,
      shopId,
      settings
    );

    return {
      success: true,
      message: "Settings saved successfully.",
    };
  } catch (error) {
    console.error(
      "Failed to save settings:",
      error
    );

    return {
      success: false,
      message:
        error.message ||
        "Unable to save settings.",
    };
  }
}

export default function AppSettings() {
  const {
    settings: initialSettings,
    currency,
  } = useLoaderData();

  const actionData = useActionData();

  const [settings, setSettings] =
    useState(initialSettings);


  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }


  return (
    <Page
      title="Settings"
      subtitle="Configure your Discount Manager"
    >

      <Form method="post">

        <BlockStack gap="400">

          {/* SUCCESS */}
          {actionData?.success && (
            <Banner tone="success">
              {actionData.message}
            </Banner>
          )}


          {/* ERROR */}
          {actionData?.success === false && (
            <Banner tone="critical">
              {actionData.message}
            </Banner>
          )}

          {/* REWARD SETTINGS */}

          <Card>

            <BlockStack gap="400">

              <Text
                variant="headingMd"
                as="h2"
              >
                Reward Settings
              </Text>

              <Text tone="subdued">
                Configure cashback and reward
                eligibility.
              </Text>

              <Divider />


              <TextField
                label="Cashback Percentage"
                name="cashbackPercentage"
                type="number"
                value={
                  settings.cashbackPercentage
                }
                onChange={(value) =>
                  updateSetting(
                    "cashbackPercentage",
                    value
                  )
                }
                suffix="%"
                helpText="Percentage of the order amount given as cashback."
                autoComplete="off"
              />


              <TextField
                label="Reward Eligibility"
                name="rewardEligibilityDays"
                type="number"
                value={
                  settings.rewardEligibilityDays
                }
                onChange={(value) =>
                  updateSetting(
                    "rewardEligibilityDays",
                    value
                  )
                }
                suffix="days"
                helpText="Number of days after delivery before cashback becomes eligible."
                autoComplete="off"
              />


              <TextField
                label="Grace Period"
                name="rewardGracePeriodDays"
                type="number"
                value={
                  settings.rewardGracePeriodDays
                }
                onChange={(value) =>
                  updateSetting(
                    "rewardGracePeriodDays",
                    value
                  )
                }
                suffix="days"
                helpText="Extra days an eligible order stays in the processing window, so a missed run doesn't skip it."
                autoComplete="off"
              />


              <TextField
                label="Coupon Validity"
                name="couponValidityDays"
                type="number"
                value={
                  settings.couponValidityDays
                }
                onChange={(value) =>
                  updateSetting(
                    "couponValidityDays",
                    value
                  )
                }
                suffix="days"
                helpText="Number of days the cashback coupon remains valid."
                autoComplete="off"
              />

            </BlockStack>

          </Card>


          {/* SAVE BUTTON */}

          <InlineStack align="end">

            <Button
              submit
              variant="primary"
            >
              Save settings
            </Button>

          </InlineStack>

        </BlockStack>

      </Form>

    </Page>
  );
}