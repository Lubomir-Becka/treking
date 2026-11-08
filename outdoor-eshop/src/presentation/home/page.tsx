import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import type { ProductListItem } from "@/domain/products/product";
import styles from "./home.module.css";

function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <div className={`${styles["lookbook-products"]} ${styles["lookbook-products-empty"]}`}>
        <p>Produktový katalóg sa momentálne pripravuje.</p>
      </div>
    );
  }

  return (
    <div className={styles["lookbook-products"]}>
      {products.map((product) => (
        <Link
          className={styles["lookbook-product"]}
          href={`/products/${product.slug}?colorId=${product.colorId}`}
          key={`${product.id}-${product.colorId}`}
        >
          <span className={styles["lookbook-product-image"]}>
            {product.imageUrl && (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 700px) 45vw, 20vw"
              />
            )}
          </span>
          <span className={styles["lookbook-product-copy"]}>
            <span className={styles.eyebrow}>
              {product.category ?? "Technická výbava"}
            </span>
            <strong>{product.name}</strong>
            <span>
              {product.price === null
                ? "Cena na vyžiadanie"
                : Number(product.price).toLocaleString("sk-SK", {
                    style: "currency",
                    currency: "EUR",
                  })}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className={styles.hero}>
      <Image 
        src="/img/hero-section.webp" 
        alt="Panoráma Vysokých Tatier" 
        fill 
        priority 
        sizes="100vw" 
      />
      <div className={styles["hero-overlay"]} />
      
      <div className={styles["hero-content"]}>
        <span className={styles.eyebrow}>
          Vysoké Tatry · Expedičný štandard 2025
        </span>
        <h1>
          Tatran.<br />
          <strong>Absolútna ochrana.</strong>
        </h1>
        <p>
          Nekompromisné 3-vrstvové membrány a technická výbava navrhnutá pre najtvrdšie podmienky stredoeurópskych veľhôr.
        </p>
        <div className={styles["hero-actions"]}>
          <a className={`${styles.button} ${styles["button-light"]}`} href="#kolekcia">
            Preskúmať kolekciu <span>→</span>
          </a>
          <a className={`${styles.button} ${styles["button-outline"]}`} href="#lookbook">
            Lookbook výbavy <span>↗</span>
          </a>
        </div>
      </div>

      <div className={styles["hero-meta"]}>
        <span>▲ Lomnický štít / 2 634 m n. m.</span>
        <span>Architektúra ticha a síl</span>
      </div>
    </section>
  );
}

type LookbookSectionProps = {
  menProducts: ProductListItem[];
  womenProducts: ProductListItem[];
};

function LookbookSection({ menProducts, womenProducts }: LookbookSectionProps) {
  return (
    <>
      <section className={`${styles.lookbook} ${styles.section}`} id="kolekcia">
        <div className={styles["section-heading"]}>
          <div>
            <span className={styles.eyebrow}>Lookbook · Alpine rigs</span>
            <h2>
              Exkluzívne kolekcie vo<br />
              <em>vysokohorskom teréne</em>
            </h2>
          </div>
          <p>
            Kompletné zostavy testované v najdrsnejších podmienkach Tatier. Preskúmajte celú výstroj a jednotlivé vrstvy technického systému.
          </p>
        </div>

        <div className={styles.rig}>
          <div className={styles["rig-title"]}>
            <span>Rig 01</span>
            <h3>Pánska zimná expedícia · Lomnický hrebeň</h3>
            <span>GORE-TEX PRO 3L · ZIMA 2025</span>
          </div>
          <div className={styles["rig-grid"]}>
            <div className={styles.scene}>
              <Image 
                src="/img/propag_men.webp" 
                alt="Mužská expedičná zostava v Tatrách" 
                fill 
                sizes="(max-width: 700px) 100vw, 50vw" 
              />
              <span className={styles["scene-tag"]}>
                Kompletná výstroj · 2 635 m n. m.
              </span>
            </div>
            <ProductGrid products={menProducts} />
          </div>
        </div>
      </section>

      <section className={`${styles.lookbook} ${styles.section}`} id="lookbook">
        <div className={styles.rig}>
          <div className={styles["rig-title"]}>
            <span>Rig 02</span>
            <h3>Dámska aktívna zostava · Priečne sedlo</h3>
            <span>ACTIVE HYBRID · RÝCHLY POHYB</span>
          </div>
          <div className={`${styles["rig-grid"]} ${styles.reverse}`}>
            <div className={styles.scene}>
              <Image 
                src="/img/propag_women.webp" 
                alt="Dámska trailová zostava v Tatrách" 
                fill 
                sizes="(max-width: 700px) 100vw, 50vw" 
              />
              <span className={styles["scene-tag"]}>
                Kompletná výstroj · 2 352 m n. m.
              </span>
            </div>
            <ProductGrid products={womenProducts} />
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage({
  menProducts,
  womenProducts,
}: {
  menProducts: ProductListItem[];
  womenProducts: ProductListItem[];
}) {
  return (
    <div className={styles["site-shell"]}>
      <Header />
      <main>
        <HeroSection />
        <LookbookSection
          menProducts={menProducts}
          womenProducts={womenProducts}
        />
      </main>
      <Footer />
    </div>
  );
}
