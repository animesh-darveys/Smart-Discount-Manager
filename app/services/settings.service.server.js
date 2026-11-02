const DEFAULT_SETTINGS = {
  defaultDiscountType: "PERCENTAGE",
  defaultDiscountStatus: "ACTIVE",
  defaultDiscountCategory: "ORDER",
  minimumPurchase: "0",
  cashbackPercentage: "5",
  rewardEligibilityDays: "14",
  rewardGracePeriodDays: "3",
  couponValidityDays: "60"
};

const GET_SETTINGS_QUERY = `#graphql
  query GetShopSettings {
    shop {
      id
      currencyCode
      metafield(
        namespace: "$app"
        key: "smart_discount_settings"
      ) {
        id
        value
      }
    }
  }
`;

const SAVE_SETTINGS_MUTATION = `#graphql
  mutation SaveShopSettings(
    $metafields: [MetafieldsSetInput!]!
  ) {
    metafieldsSet(
      metafields: $metafields
    ) {
      metafields {
        id
        namespace
        key
        value
      }

      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function getShopSettings(admin) {
  const response = await admin.graphql(GET_SETTINGS_QUERY);

  const result = await response.json();

  const shop = result.data.shop;

  let settings = DEFAULT_SETTINGS;

  if (shop.metafield?.value) {
    try {
      settings = {
        ...DEFAULT_SETTINGS,
        ...JSON.parse(shop.metafield.value),
      };
    } catch (error) {
      console.error("Invalid settings JSON:", error);
    }
  }

  return {
    settings,
    currency: shop.currencyCode,
    shopId: shop.id,
  };
}

export async function saveShopSettings(
  admin,
  shopId,
  settings
) {
  const response = await admin.graphql(
    SAVE_SETTINGS_MUTATION,
    {
      variables: {
        metafields: [
          {
            ownerId: shopId,
            namespace: "$app",
            key: "smart_discount_settings",
            type: "json",
            value: JSON.stringify(settings),
          },
        ],
      },
    }
  );

  const result = await response.json();

  const errors =
    result.data.metafieldsSet.userErrors;

  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return result.data.metafieldsSet.metafields[0];
}