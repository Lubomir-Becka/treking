import Image from "next/image";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import type { ProductListItem } from "@/modules/products/domain/product";
import styles from "./home.module.css";

function ProductList({ product }: { product: ProductListItem | null }) {
  if (!product) {
    return (
      <div className={`${styles["lookbook-products"]} ${styles["lookbook-products-empty"]}`}>
        <p>Produktový katalóg sa momentálne pripravuje.</p>
      </div>
    );
  }

  return (
    <div className={styles["lookbook-products"]}>
      <div className={styles["product-preview"]}>
        <Image 
          src={product.imageUrl ?? "/detail_produktu.png"} 
          alt={product.name} 
          fill 
          sizes="(max-width: 700px) 100vw, 35vw" 
        />
        <span className={styles["product-preview-label"]}>
          {product.category ?? "Technická výbava"}
        </span>
      </div>

      <div className={styles["product-info"]}>
        <span className={styles.eyebrow}>
          {product.brand} · {product.category ?? "Kolekcia"}
        </span>
        <h3>{product.name}</h3>
        <p>
          {product.description ?? "Technická výbava pre náročné podmienky."}
        </p>
        <strong>
          {product.price === null 
            ? "Cena na vyžiadanie" 
            : Number(product.price).toLocaleString("sk-SK", { 
                style: "currency", 
                currency: "EUR" 
              })}
        </strong>
        <a href={`/products/${product.slug}`}>
          Zobraziť detail <span>→</span>
        </a>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className={styles.hero}>
      <Image 
        src="/img/hero-section.png" 
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
  featuredProduct: ProductListItem | null;
  secondaryProduct?: ProductListItem | null;
};

function LookbookSection({ featuredProduct, secondaryProduct }: LookbookSectionProps) {
  const womenProduct = secondaryProduct ?? featuredProduct;

  return (
    <>
      <section className={`${styles.lookbook} ${styles.section}`} id="lookbook-men">
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
                src="/img/propag_men.png" 
                alt="Mužská expedičná zostava v Tatrách" 
                fill 
                sizes="(max-width: 700px) 100vw, 50vw" 
              />
              <span className={styles["scene-tag"]}>
                Kompletná výstroj · 2 635 m n. m.
              </span>
            </div>
            <ProductList product={featuredProduct} />
          </div>
        </div>
      </section>

      <section className={`${styles.lookbook} ${styles.section}`} id="lookbook-women">
        <div className={styles.rig}>
          <div className={styles["rig-title"]}>
            <span>Rig 02</span>
            <h3>Dámska aktívna zostava · Priečne sedlo</h3>
            <span>ACTIVE HYBRID · RÝCHLY POHYB</span>
          </div>
          <div className={`${styles["rig-grid"]} ${styles.reverse}`}>
            <div className={styles.scene}>
              <Image 
                src="/img/propag_women.png" 
                alt="Dámska trailová zostava v Tatrách" 
                fill 
                sizes="(max-width: 700px) 100vw, 50vw" 
              />
              <span className={styles["scene-tag"]}>
                Kompletná výstroj · 2 352 m n. m.
              </span>
            </div>
            <ProductList product={womenProduct} />
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className={styles["site-shell"]}>
      <Header />
      <main>
        <HeroSection />
        <LookbookSection featuredProduct={null} secondaryProduct={null} />
      </main>
      <Footer />
    </div>
  );
}
