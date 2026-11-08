export function selectLookbookProducts<T extends { slug: string }>(
  catalog: T[],
  slugs: string[],
): T[] {
  return slugs.flatMap((slug) => {
    const product = catalog.find((item) => item.slug === slug);
    return product ? [product] : [];
  });
}
