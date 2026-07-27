export async function openResourcePicker({
  shopify,
  type,
  selectedItems,
  mapper,
  setSelectedItems,
}) {
  try {
    const resources = await shopify.resourcePicker({
      type,
      multiple: true,
      selectionIds: selectedItems.map((item) => ({
        id: item.id,
      })),
    });

    if (!resources) return;

    setSelectedItems(resources.map(mapper));
  } catch (error) {
    console.error(`${type} Picker Error:`, error);
  }
}