// @ts-nocheck
import { useEffect, useState } from 'preact/hooks';
import '@shopify/ui-extensions/preact';
import { render } from 'preact';

export function DiscountOffers() {
  const customer = shopify.buyerIdentity?.customer.value;

  if (!customer) {
    return null;
  }

  const customerId = customer.id ?? 'Customer';

  const [offers, setOffers] = useState([]);
  const [appliedCode, setAppliedCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const orderValue = shopify.cost.totalAmount.value.amount;

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    const updateAppliedCode = () => {
      const codes = shopify.discountCodes.value;
      if (codes.length > 0) {
        setAppliedCode(codes[0].code);
      } else {
        setAppliedCode(null);
      }
    };

    // Initial load
    updateAppliedCode();

    // Listen for changes
    const unsubscribe = shopify.discountCodes.subscribe(updateAppliedCode);

    return () => unsubscribe();
  }, []);

  async function loadOffers() {
    const result = await shopify.query(`
      query {
        metaobjects(type: "discount", first: 10) {
          nodes {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      }
    `);

    const formattedOffers = result.data.metaobjects.nodes.map((offer) => {
      const data = {
        id: offer.id,
        handle: offer.handle,
      };

      offer.fields.forEach((field) => {
        data[field.key] = field.value;
      });

      return data;
    });

    // setOffers(formattedOffers);
    const eligibleOffers = formattedOffers.filter((offer) => {
      // 1. Welcome discount sirf first-time customers ke liye
      if (
        offer.discount_scope?.toUpperCase() === "WELCOME" &&
        Number(customer.ordersCount) > 0
      ) {
        return false;
      }

      // 2. Agar customer select nahi hai to sabko dikhao
      if (!offer.customer) {
        return true;
      }

      // 3. Customer-specific offer ho to customer ID match honi chahiye
      return offer.customer === customerId;
    });

    setOffers(eligibleOffers);

  }

  if (!offers.length) {
    return <s-button>Loading... <s-spinner accessibilityLabel="Loading"></s-spinner></s-button>;
  }
  return (
    <>
      <s-button tone="neutral" variant="auto" command="--show" commandFor="view-offers">
        View Coupons
      </s-button>

      <s-modal id="view-offers" heading="Discounts & Offers" size="large">

        <s-stack gap="small" paddingBlockEnd="large">
          {offers.map((offer) => {
            const minimumPurchase = Number(offer.minimum_purchase || 0);
            const isEligible = orderValue >= minimumPurchase;

            return (
              <s-grid
                accessibilityLabel="Product listing"
                gridTemplateColumns="1fr auto"
                gap="base"
                key={offer.id}
                background="base"
                border="base"
                padding="small"
                borderRadius="small"
              >
                <s-grid-item>
                  <s-box
                    paddingBlockEnd="small"
                    accessibilityLabel="Product notice"
                  >
                    <s-text color="base" type="strong">
                      {offer.title}
                    </s-text>
                  </s-box>

                  <s-paragraph type="small">
                    {offer.description}
                  </s-paragraph>

                  <s-paragraph color="subdued" type="small">
                    Valid on order above: £{offer.minimum_purchase}
                  </s-paragraph>

                  {!isEligible && (
                    <s-paragraph color="subdued" type="small">
                      Spend £{(minimumPurchase - orderValue).toFixed(2)} more to unlock this offer.
                    </s-paragraph>
                  )}
                </s-grid-item>

                <s-grid-item>
                  {loadingCode === offer.code ? (
                    <s-button disabled>
                      Loading...
                    </s-button>
                  ) : isEligible ? (
                    <>
                      <s-button
                        command="--copy"
                        commandFor={`discount-code-${offer.id}`}
                      >
                        Copy
                      </s-button>

                      <s-clipboard-item
                        id={`discount-code-${offer.id}`}
                        text={offer.code}
                      />
                    </>
                  ) : (
                    <s-button disabled>
                      Locked
                    </s-button>
                  )}

                </s-grid-item>
              </s-grid>
            );
          })}
        </s-stack>
      </s-modal>
    </>
  );
}