import type { AdminCategory } from "@/features/products/domain/CategoryManagement";

export async function runCategoryMutation(
  action: () => Promise<void>,
  refresh: () => Promise<AdminCategory[]>,
): Promise<
  | { status: "updated"; categories: AdminCategory[] }
  | { status: "refresh-failed" }
> {
  await action();
  try {
    return { status: "updated", categories: await refresh() };
  } catch {
    return { status: "refresh-failed" };
  }
}
