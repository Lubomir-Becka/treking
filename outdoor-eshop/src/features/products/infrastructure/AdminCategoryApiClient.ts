import type { AdminCategory, CategoryInput } from "../domain/CategoryManagement";

export class CategoryMutationOutcomeUnknown extends Error {
  constructor() {
    super("Výsledok operácie nie je známy. Obnovte zoznam a overte, či sa zmena vykonala.");
    this.name = "CategoryMutationOutcomeUnknown";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const mutation = init?.method !== undefined && init.method !== "GET";
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch {
    if (mutation) throw new CategoryMutationOutcomeUnknown();
    throw new Error("Spojenie so serverom zlyhalo.");
  }
  if (mutation && !response.ok && ![400, 401, 403, 404, 409].includes(response.status)) {
    throw new CategoryMutationOutcomeUnknown();
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (mutation) throw new CategoryMutationOutcomeUnknown();
    throw new Error("Odpoveď servera nie je platná.");
  }
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null &&
      "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "Operáciu s kategóriou sa nepodarilo vykonať.";
    throw new Error(message);
  }
  return payload;
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const payload = await request("/api/admin/categories");
  if (
    typeof payload !== "object" || payload === null ||
    !("data" in payload) || !Array.isArray(payload.data) ||
    !payload.data.every((category: unknown) =>
      typeof category === "object" && category !== null &&
      "id" in category && typeof category.id === "number" &&
      "name" in category && typeof category.name === "string" &&
      "slug" in category && typeof category.slug === "string" &&
      "parentId" in category && (category.parentId === null || typeof category.parentId === "number") &&
      "productCount" in category && typeof category.productCount === "number" &&
      "childCount" in category && typeof category.childCount === "number"
    )
  ) {
    throw new Error("Odpoveď kategórií nemá platný formát.");
  }
  return payload.data;
}

export async function saveAdminCategory(input: CategoryInput, id?: number) {
  const payload = await request(id === undefined ? "/api/admin/categories" : `/api/admin/categories/${id}`, {
    method: id === undefined ? "POST" : "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  assertMutationSuccess(payload);
}

export async function deleteAdminCategory(id: number) {
  const payload = await request(`/api/admin/categories/${id}`, { method: "DELETE" });
  assertMutationSuccess(payload);
}

function assertMutationSuccess(payload: unknown): void {
  if (
    typeof payload !== "object" || payload === null ||
    !("data" in payload) || typeof payload.data !== "object" || payload.data === null ||
    !("success" in payload.data) || payload.data.success !== true
  ) {
    throw new CategoryMutationOutcomeUnknown();
  }
}
