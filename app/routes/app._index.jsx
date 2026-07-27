import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page heading="Shopify app">
      <s-section accessibilityLabel="Empty discount state">
        <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
          <s-box maxInlineSize="200px" maxBlockSize="200px">
            <s-image
              aspectRatio="1/0.5"
              src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
              alt="Illustration showing no discounts"
            />
          </s-box>

          <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
            <s-stack alignItems="center">
              <s-heading>No discount yet</s-heading>
            </s-stack>
          </s-grid>
        </s-grid>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};