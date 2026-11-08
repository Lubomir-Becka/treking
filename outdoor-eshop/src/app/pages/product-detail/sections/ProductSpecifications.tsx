import type { ProductDetail } from "@/features/products/domain/product";
import styles from "./product-specifications.module.css";

type ProductSpecificationsProps = {
  product: ProductDetail;
  variantCount: number;
};

export function ProductSpecifications({
  product,
  variantCount,
}: ProductSpecificationsProps) {
  return (
    <>
      <section className={styles.section} aria-labelledby="specs-title">
        <div className={styles.heading}>
          <span className="eyebrow" id="specs-title">Technické parametre</span>
        </div>
        <div className={styles.grid}>
          {product.attributes.map((attribute) => (
            <article key={attribute.label}>
              <span>◈</span>
              <small>{attribute.label}</small>
              <strong>
                {attribute.value}
                {attribute.unit ? ` ${attribute.unit}` : ""}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="details-title">
        <div className={styles.heading}>
          <span className="eyebrow" id="details-title">Detaily produktu</span>
        </div>
        <div className={styles.accordions}>
          <details open>
            <summary>Varianty a dostupnosť<span>+</span></summary>
            <p>{product.colors.length} farebné varianty a {variantCount} aktívnych veľkostných variantov.</p>
          </details>
          <details open>
            <summary>Identifikácia produktu<span>+</span></summary>
            <p>Značka: {product.brand}. Slug: {product.slug}.</p>
          </details>
        </div>
      </section>
    </>
  );
}
