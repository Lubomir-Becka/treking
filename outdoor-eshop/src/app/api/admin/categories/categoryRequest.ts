import { NextResponse } from "next/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { validateCategoryInput, type CategoryInput } from "@/features/products/domain/CategoryManagement";

type ParsedCategory =
  | { valid: true; input: CategoryInput }
  | { valid: false; error: string };

export async function parseCategoryRequest(request: Request): Promise<ParsedCategory> {
  const parsed = await readJsonBody(request);
  if (!parsed.valid || !isJsonObject(parsed.body)) {
    return { valid: false, error: "Skontrolujte údaje kategórie." };
  }
  const { name, slug, parentId } = parsed.body;
  if (
    typeof name !== "string" ||
    typeof slug !== "string" ||
    (parentId !== null && typeof parentId !== "number")
  ) return { valid: false, error: "Skontrolujte údaje kategórie." };
  const input = { name, slug, parentId };
  const error = validateCategoryInput(input);
  return error ? { valid: false, error } : { valid: true, input };
}

export function categoryError(error: unknown) {
  if (error instanceof Error) {
    const messages: Record<string, { message: string; status: number }> = {
      INVALID_CATEGORY: { message: "Skontrolujte údaje kategórie.", status: 400 },
      INVALID_CATEGORY_ID: { message: "Neplatná kategória.", status: 400 },
      INVALID_CATEGORY_PARENT: { message: "Nadradená kategória musí byť hlavná a nesmie vytvoriť cyklus ani tretiu úroveň.", status: 400 },
      CATEGORY_NOT_FOUND: { message: "Kategória neexistuje.", status: 404 },
      CATEGORY_SLUG_EXISTS: { message: "Kategória s týmto slugom už existuje.", status: 409 },
      CATEGORY_IN_USE: { message: "Kategóriu nemožno odstrániť, kým obsahuje produkty alebo podkategórie.", status: 409 },
    };
    const known = messages[error.message];
    if (known) return NextResponse.json({ error: known.message }, { status: known.status });
  }
  console.error("Category management failed:", error);
  return NextResponse.json({ error: "Operáciu s kategóriou sa nepodarilo vykonať." }, { status: 500 });
}
