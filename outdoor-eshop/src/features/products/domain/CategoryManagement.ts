export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  productCount: number;
  childCount: number;
};

export type CategoryInput = {
  name: string;
  slug: string;
  parentId: number | null;
};

export function isCategoryId(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 2_147_483_647;
}

export function validateCategoryInput(value: CategoryInput): string | null {
  if (!value.name.trim() || value.name.trim().length > 100) {
    return "Názov je povinný a môže mať najviac 100 znakov.";
  }
  if ([...value.name].some((character) => {
    const code = character.codePointAt(0);
    return code !== undefined && (code < 32 || (code >= 127 && code <= 159));
  })) {
    return "Názov nesmie obsahovať riadiace znaky.";
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) || value.slug.length > 120) {
    return "Slug môže obsahovať malé písmená, čísla a pomlčky medzi slovami.";
  }
  if (value.parentId !== null && !isCategoryId(value.parentId)) {
    return "Vyberte platnú nadradenú kategóriu.";
  }
  return null;
}

export function isValidCategoryParent(
  categories: Array<{ id: number; parentId: number | null }>,
  parentId: number | null,
  id?: number,
): boolean {
  if (parentId === null) return true;

  const parent = categories.find((category) => category.id === parentId);
  return Boolean(
    parent &&
    parent.parentId === null &&
    parent.id !== id &&
    (id === undefined || !categories.some((category) => category.parentId === id)),
  );
}

export interface CategoryManagementRepository {
  list(): Promise<AdminCategory[]>;
  save(input: CategoryInput, id?: number): Promise<void>;
  delete(id: number): Promise<void>;
}
