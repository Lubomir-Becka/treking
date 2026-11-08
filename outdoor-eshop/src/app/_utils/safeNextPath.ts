const INTERNAL_ORIGIN = "https://vertex.internal";
const DEFAULT_NEXT_PATH = "/account";

export function getSafeNextPath(value: string | string[] | undefined): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return DEFAULT_NEXT_PATH;
  }

  const destination = new URL(value, INTERNAL_ORIGIN);
  if (destination.origin !== INTERNAL_ORIGIN) {
    return DEFAULT_NEXT_PATH;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
