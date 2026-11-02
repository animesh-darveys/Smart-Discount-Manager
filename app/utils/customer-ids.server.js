const CUSTOMER_GID_PREFIX = "gid://shopify/Customer/";

// Accepts an array, a single ID, or a comma/space separated string of
// numeric IDs or GIDs, and returns de-duplicated customer GIDs.
export function toCustomerGids(value) {
  const rawValues = Array.isArray(value)
    ? value.flat(Infinity)
    : [value];

  const gids = rawValues
    .filter((item) => item !== null && item !== undefined)
    .flatMap((item) => String(item).split(/[\s,]+/))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) =>
      item.startsWith(CUSTOMER_GID_PREFIX)
        ? item
        : `${CUSTOMER_GID_PREFIX}${item}`
    );

  for (const gid of gids) {
    if (!/^\d+$/.test(gid.slice(CUSTOMER_GID_PREFIX.length))) {
      throw new Error(`Invalid customer ID: ${gid}`);
    }
  }

  return [...new Set(gids)];
}

export function toCustomerGid(id) {
  return toCustomerGids(id)[0] ?? null;
}
