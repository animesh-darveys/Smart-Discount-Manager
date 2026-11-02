function OfferCard({
  offer,
  appliedCode,
  applyDiscount,
  removeDiscount,
}) {
  return (
    <s-grid
      accessibilityLabel="Product listing"
      gridTemplateColumns="1fr auto"
      gap="base"
      background="base"
      border="base"
      padding="base"
      borderRadius="large"
    >
      <s-grid-item>
        <s-heading>{offer.code}</s-heading>

        <s-paragraph>{offer.description}</s-paragraph>

        <s-paragraph color="subdued">
          Valid on order above: £{offer.minimum_purchase}
        </s-paragraph>
      </s-grid-item>

      <s-grid-item>
        {appliedCode === offer.code ? (
          <s-button onClick={() => removeDiscount(offer.code)}>
            Remove
          </s-button>
        ) : (
          <s-button onClick={() => applyDiscount(offer.code)}>
            Apply
          </s-button>
        )}
      </s-grid-item>
    </s-grid>
  );
}