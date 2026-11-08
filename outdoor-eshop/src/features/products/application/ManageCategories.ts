import {
  isCategoryId,
  validateCategoryInput,
  type CategoryInput,
  type CategoryManagementRepository,
} from "../domain/CategoryManagement";

function assertId(id: number) {
  if (!isCategoryId(id)) {
    throw new Error("INVALID_CATEGORY_ID");
  }
}

export function createCategoryManagement(repository: CategoryManagementRepository) {
  return {
    list: () => repository.list(),
    async save(input: CategoryInput, id?: number) {
      if (id !== undefined) assertId(id);
      if (validateCategoryInput(input)) throw new Error("INVALID_CATEGORY");
      await repository.save({ ...input, name: input.name.trim() }, id);
    },
    async delete(id: number) {
      assertId(id);
      await repository.delete(id);
    },
  };
}
