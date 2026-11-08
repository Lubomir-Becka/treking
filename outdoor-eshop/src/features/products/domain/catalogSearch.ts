export const MAX_CATALOG_QUERY_LENGTH = 200;

export function isValidCatalogQuery(value: string) {
  return value.length <= MAX_CATALOG_QUERY_LENGTH &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
}
