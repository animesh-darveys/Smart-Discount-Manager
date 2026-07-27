export const mapProduct = (product) => ({
  id: product.id,
  title: product.title,
  vendor: product.vendor,
  image: product.images?.[0]?.originalSrc ?? "",
  handle: product.handle,
  status: product.status,
});

export const mapCollection = (collection) => ({
  id: collection.id,
  title: collection.title,
  image: collection.image?.originalSrc ?? "",
  handle: collection.handle,
});