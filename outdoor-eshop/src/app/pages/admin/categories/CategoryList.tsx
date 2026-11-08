import type { AdminCategory } from "@/features/products/domain/CategoryManagement";
import styles from "../admin.module.css";

type Props = {
  categories: AdminCategory[];
  disabled: boolean;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
};

export function CategoryList({ categories, disabled, onEdit, onDelete }: Props) {
  if (categories.length === 0) {
    return <p>Zatiaľ nie sú vytvorené žiadne kategórie.</p>;
  }

  return (
    <ul className={styles.categoryList}>
      {categories
        .filter((category) => category.parentId === null)
        .flatMap((category) => [
          category,
          ...categories.filter((child) => child.parentId === category.id),
        ])
        .map((category) => (
        <li key={category.id} className={styles.categoryItem}>
          <div>
            <strong>{category.parentId === null ? category.name : `↳ ${category.name}`}</strong>
            <p>Slug: {category.slug}</p>
            <p>
              Nadradená kategória:{" "}
              {categories.find((parent) => parent.id === category.parentId)?.name ?? "Žiadna"}
            </p>
            <p>
              Produkty: {category.productCount} · Podkategórie: {category.childCount}
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" disabled={disabled} onClick={() => onEdit(category)}>
              Upraviť
            </button>
            <button
              type="button"
              disabled={disabled || category.productCount > 0 || category.childCount > 0}
              onClick={() => onDelete(category)}
            >
              Odstrániť
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
