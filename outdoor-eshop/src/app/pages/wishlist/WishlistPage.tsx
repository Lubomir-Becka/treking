"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CustomerFavoriteButton } from "@/app/_components/customer/client";
import { fetchFavoriteProducts } from "@/features/products/composition/client";
import type { CatalogProductDto } from "@/features/products/contracts/products";
import { useFavorites } from "@/app/_components/customer/FavoritesProvider";
import styles from "./wishlist.module.css";

export function WishlistPage() {
  const [products, setProducts] = useState<CatalogProductDto[]>([]);
  const { authenticated, ids: favoriteIds, busy, error, reload } = useFavorites();
  const [isLoading, setIsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!authenticated || busy || error) return;
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setProductsError(null);

    fetchFavoriteProducts(favoriteIds, controller.signal)
      .then((loadedProducts) => {
        if (active) setProducts(loadedProducts);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setProductsError(
            loadError instanceof Error
              ? loadError.message
              : "Obľúbené produkty sa nepodarilo načítať.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [favoriteIds, authenticated, busy, error, retryCount]);

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteIds.includes(product.colorId)),
    [favoriteIds, products],
  );

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Drobková navigácia">
        <Link href="/">Úvod</Link>
        <span>/</span>
        <span>Obľúbené položky</span>
      </nav>
      <section className={styles.wishlistHero}>
        <div>
          <span className={styles.kicker}>Obľúbené položky</span>
          <h1>Váš zoznam prianí</h1>
          <p>Produkty, ku ktorým sa chcete neskôr vrátiť.</p>
        </div>
      </section>

      {!authenticated ? (
        <section className={styles.wishlistEmpty}>
          <p>Pre uloženie obľúbených produktov sa prihláste.</p>
          <Link className={styles.primaryButton} href="/login?next=%2Fwishlist">
            Prihlásiť sa
          </Link>
        </section>
      ) : error ? (
        <section className={styles.wishlistEmpty} role="alert">
          <p>{error}</p>
          <button type="button" disabled={busy} onClick={() => void reload()}>Obnoviť</button>
        </section>
      ) : productsError ? (
        <section className={styles.wishlistEmpty} role="alert">
          <p>{productsError}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Obnoviť
          </button>
        </section>
      ) : busy || isLoading ? (
        <section className={styles.wishlistEmpty} role="status">
          <p>Načítavame obľúbené položky…</p>
        </section>
      ) : favoriteProducts.length === 0 ? (
        <section className={styles.wishlistEmpty}>
          <p>Zatiaľ tu nemáte žiadne obľúbené produkty.</p>
          <Link className={styles.primaryButton} href="/search">
            Prezerať produkty
          </Link>
        </section>
      ) : (
        <section className={styles.wishlistProducts} aria-label="Obľúbené produkty">
          {favoriteProducts.map((product) => (
            <article className={styles.wishlistProduct} key={`${product.id}-${product.colorId}`}>
              <CustomerFavoriteButton
                colorId={product.colorId}
                className={styles.wishlistFavorite}
              />
              <Link
                href={`/products/${product.slug}?colorId=${product.colorId}`}
                className={styles.wishlistProductLink}
              >
                <span className={styles.wishlistProductImage}>
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 700px) 100vw, 30vw"
                    />
                  )}
                </span>
                <span className={styles.wishlistProductBody}>
                  <strong>{product.name}</strong>
                  <small>{product.colorName ?? "Farba neuvedená"}</small>
                  <b>
                    {product.price === null
                      ? "Cena na vyžiadanie"
                      : Number(product.price).toLocaleString("sk-SK", {
                          style: "currency",
                          currency: "EUR",
                        })}
                  </b>
                </span>
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
