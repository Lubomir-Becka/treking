export type NavigationCategory = {
  name: string;
  slug: string;
  children: Array<{ name: string; slug: string }>;
};

function isNavigationCategory(value: unknown): value is NavigationCategory {
  if (typeof value !== "object" || value === null) return false;
  const category = value as Record<string, unknown>;
  return typeof category.name === "string" && typeof category.slug === "string" &&
    Array.isArray(category.children) && category.children.every(
      (child) => typeof child === "object" && child !== null &&
        "name" in child && typeof child.name === "string" &&
        "slug" in child && typeof child.slug === "string",
    );
}

export async function fetchNavigationCategories(audience: "men" | "women"): Promise<NavigationCategory[]> {
  const response = await fetch(`/api/categories?audience=${audience}`);
  if (!response.ok) throw new Error("Category request failed.");
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" || payload === null ||
    !("data" in payload) || !Array.isArray(payload.data) ||
    !payload.data.every(isNavigationCategory)
  ) {
    throw new Error("Category response is invalid.");
  }
  return payload.data;
}
