export function getCategoryListingIds(
  category: { id: number; parentId: number | null },
  children: Array<{ id: number }>,
): number[] {
  return category.parentId === null
    ? [category.id, ...children.map(({ id }) => id)]
    : [category.id];
}
