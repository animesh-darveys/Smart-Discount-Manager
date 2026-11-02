import '@shopify/ui-extensions/preact';
import { render } from 'preact';

import { DiscountOffers } from './components/DiscountOffers.jsx';

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  return (
    <>
      <DiscountOffers />
    </>
  );
}