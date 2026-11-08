"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { CustomerFavoriteButton } from "@/app/_components/customer/client";
import styles from "./catalog.module.css";
import type { CatalogProductDto } from "@/features/products/contracts/products";

export type CatalogCategoryLink = {
  name: string;
  slug: string;
  imageUrl?: string | null;
};

type Props = {
  products: CatalogProductDto[];
  title: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  query?: string;
  subcategories?: CatalogCategoryLink[];
  showRecommendations?: boolean;
  audience?: "men" | "women" | "unisex";
  categories?: CatalogCategoryLink[];
  isLoading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
};

function ProductCard({ product }: { product: CatalogProductDto }) {
  const formattedPrice =
    product.price === null
      ? "Cena na vyžiadanie"
      : Number(product.price).toLocaleString("sk-SK", {
          style: "currency",
          currency: "EUR",
        });

  const productHref = `/products/${product.slug}?colorId=${product.colorId}`;

  return (
    <article className={styles.catalogProduct}>
      <CustomerFavoriteButton
        colorId={product.colorId}
        className={styles.catalogFavorite}
      />
      <Link
        className={styles.catalogProductLink}
        href={productHref}
      >
        <div className={styles.catalogProductImage}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span>Produktový náhľad</span>
          )}
        </div>

        <div className={styles.catalogProductCopy}>
          <span className={styles.catalogKicker}>
            {product.brand}
            {product.category ? ` · ${product.category}` : ""}
          </span>
          <h3>{product.name}</h3>
          <span className={styles.catalogVariant}>
            <span
              className={styles.catalogVariantSwatch}
              style={{ backgroundColor: product.hexCode ?? "#fff" }}
              aria-hidden="true"
            />
            {product.colorName ?? "Farba neuvedená"}
          </span>
          <p>{product.description ?? "Technická výbava pre náročné podmienky."}</p>

          <div className={styles.catalogProductFooter}>
            <strong>{formattedPrice}</strong>
            <span>{product.stock ?? 0} ks skladom</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function CategoryGrid({
  categories,
  audience,
  label,
}: {
  categories: CatalogCategoryLink[];
  audience?: "men" | "women" | "unisex";
  label: string;
}) {
  return (
    <section className={`${styles.catalogSubcategories} ${styles.catalogContainer}`}>
      <div className={styles.catalogSectionLabel}>
        <span className={styles.eyebrow}>{label}</span>
        <span>{categories.length} kategórií</span>
      </div>
      <div className={styles.catalogSubcategoryGrid}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}${audience ? `?audience=${audience}` : ""}`}
            className={styles.catalogSubcategoryCard}
          >
            {category.imageUrl && (
              <span className={styles.catalogSubcategoryImage}>
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 50vw, 25vw"
                />
              </span>
            )}
            <span className={styles.catalogSubcategoryDetails}>
              <strong>{category.name}</strong>
            </span>
            <span className={styles.catalogArrow}>↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function CatalogListingClient({
  products,
  title,
  breadcrumb,
  query = "",
  subcategories = [],
  showRecommendations = false,
  audience,
  categories = [],
  isLoading = false,
  loadError = null,
  onRetry,
}: Props) {
  const [maxPrice, setMaxPrice] = useState(850);
  const [stockOnly, setStockOnly] = useState(false);
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = Number(maxPrice < 850) + Number(stockOnly);

  const visibleProducts = useMemo(() => {
    const result = products.filter((product) => {
      const price = product.price === null ? Infinity : Number(product.price);
      const matchesPrice = price <= maxPrice;
      const matchesStock = !stockOnly || (product.stock ?? 0) > 0;

      return matchesPrice && matchesStock;
    });

    if (sort === "featured") return result;
    return result.sort((a, b) => {
      if (sort === "price-asc") return Number(a.price ?? Infinity) - Number(b.price ?? Infinity);
      return Number(b.price ?? -Infinity) - Number(a.price ?? -Infinity);
    });
  }, [maxPrice, products, sort, stockOnly]);

  return (
    <main className={`site-shell ${styles.catalogPage}`}>
      {/* 1. Heading & Breadcrumbs */}
      <section className={styles.catalogHeading}>
        <div className={styles.catalogContainer}>
          <nav className={styles.catalogBreadcrumbs} aria-label="Drobková navigácia">
            <Link href="/">Úvod</Link>
            <span>/</span>
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`}>
                {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
              </span>
            ))}
          </nav>

          <div className={styles.catalogFilterBar}>
            <span>{activeFilterCount} aktívne filtre</span>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <CategoryGrid
          categories={categories}
          audience={audience}
          label="Kategórie"
        />
      )}

      {subcategories.length > 0 && (
        <CategoryGrid
          categories={subcategories}
          audience={audience}
          label="Podkategórie"
        />
      )}

      {/* 3. Results Toolbar */}
      <div className={`${styles.catalogResultToolbar} ${styles.catalogContainer}`}>
        <label className={styles.catalogSort}>
          Zoradiť:
          <select
            value={sort}
            onChange={(event) => {
              const value = event.target.value;

              if (
                value === "featured" ||
                value === "price-asc" ||
                value === "price-desc"
              ) {
                setSort(value);
              }
            }}
          >
            <option value="featured">Základné poradie</option>
            <option value="price-asc">Cena: najnižšia</option>
            <option value="price-desc">Cena: najvyššia</option>
          </select>
        </label>
      </div>

      {/* 4. Main Grid & Sidebar */}
      <section className={`${styles.catalogResults} ${styles.catalogContainer}`}>
        <aside
          className={`${styles.catalogSidebar} ${filtersOpen ? styles.catalogSidebarOpen : ""}`}
          aria-label="Filtrovacie možnosti"
        >
          <div className={styles.catalogSidebarTitle}>
            <span className={styles.eyebrow}>Filtre katalógu</span>
            <span>{activeFilterCount} aktívne</span>
          </div>

          <button
            className={styles.catalogFilterToggle}
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filtre{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            <span>{filtersOpen ? "−" : "+"}</span>
          </button>

          <div className={styles.catalogSidebarContent}>
            <details open>
              <summary>
                Cena<span>+</span>
              </summary>
              <div className={styles.catalogPriceRange}>
                <input
                  type="range"
                  min="150"
                  max="850"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
                <div>
                  <span>150 €</span>
                  <span>{maxPrice} €</span>
                </div>
              </div>
            </details>

            <label className={styles.catalogStock}>
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={(event) => setStockOnly(event.target.checked)}
              />
              <span>Iba skladom</span>
            </label>
          </div>
        </aside>

        <div className={styles.catalogGrid}>
          <div className={styles.catalogGridHeading}>
            <strong>{query ? `Výsledky „${query}“` : `Výsledky ${title}`}</strong>
            <span>{visibleProducts.length} variantov</span>
          </div>

          {loadError ? (
            <div className={styles.catalogEmpty} role="alert">
              <span className={styles.eyebrow}>Chyba načítania</span>
              <h2>{loadError}</h2>
              {onRetry && (
                <button type="button" onClick={onRetry}>
                  Skúsiť znova
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div className={styles.catalogEmpty} role="status">
              <h2>Načítavame varianty…</h2>
            </div>
          ) : visibleProducts.length > 0 ? (
            visibleProducts.map((product) => (
            <ProductCard key={`${product.id}-${product.colorId}`} product={product} />
            ))
          ) : subcategories.length === 0 ? (
            <div className={styles.catalogEmpty}>
              <span className={styles.eyebrow}>Bez výsledkov</span>
              <h2>Pre zvolené filtre sme nenašli produkty.</h2>
              <p>
                {showRecommendations
                  ? "Skúste zmeniť vyhľadávanie alebo upraviť filtre."
                  : "Skúste upraviť filtre."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
