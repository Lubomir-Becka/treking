"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CustomerFavoriteButton } from "@/presentation/customer/client";
import { parseCatalogProductsResponse } from "@/presentation/products/client";
import type { CatalogProductDto } from "@/presentation/products/contracts/CatalogProductDto";
import { customerFavorites } from "@/composition/client/customerFavorites";
import styles from "./customer.module.css";

export function WishlistPage() {
  const [products, setProducts] = useState<CatalogProductDto[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    function updateFavorites() {
      try {
        setFavoriteIds(customerFavorites.getFavoriteColorIds());
      } catch {
        setError("Obľúbené položky sa nepodarilo načítať z tohto zariadenia.");
      }
    }

    updateFavorites();
    const unsubscribe = customerFavorites.subscribe(updateFavorites);

    fetch("/api/products?limit=100")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Produkty sa nepodarilo načítať.");
        }

        const payload = parseCatalogProductsResponse(await response.json());
        if (active) {
          setProducts(payload.data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
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
      unsubscribe();
    };
  }, []);

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

      {error ? (
        <section className={styles.wishlistEmpty} role="alert">
          <p>{error}</p>
        </section>
      ) : isLoading ? (
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
            <article className={styles.wishlistProduct} key={product.id}>
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
