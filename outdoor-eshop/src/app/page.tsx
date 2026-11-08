import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ProductListItem } from "@/modules/products/domain/product";

function ProductList({ product }: { product: ProductListItem | null }) {
  if (!product) {
    return (
      <div className="lookbook-products lookbook-products-empty">
        <p>Produktový katalóg sa momentálne pripravuje.</p>
      </div>
    );
  }
}
function HeroSection() {
  return (
    <section className="hero">
      <Image
        src="/img/hero-section.png"
        alt="Panoráma Vysokých Tatier"
        fill
        priority
        sizes="100vw"
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="eyebrow">
          Vysoké Tatry · Expedičný štandard 2025
        </span>
        <h1>
          Tatran.
          <br />
          <strong>Absolútna ochrana.</strong>
        </h1>
        <p>
          Nekompromisné 3-vrstvové membrány a technická výbava navrhnutá pre
          najtvrdšie podmienky stredoeurópskych veľhôr.
        </p>
        <div className="hero-actions">
          <a className="button button-light" href="#kolekcia">
            Preskúmať kolekciu <span>→</span>
          </a>
          <a className="button button-outline" href="#lookbook">
            Lookbook výbavy <span>↗</span>
          </a>
        </div>
      </div>
      <div className="hero-meta">
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

function LookbookSection({
  featuredProduct,
  secondaryProduct,
}: LookbookSectionProps) {
  const womenProduct = secondaryProduct ?? featuredProduct;

  return (
    <>
      <section className="lookbook section" id="lookbook-men">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Lookbook · Alpine rigs</span>
            <h2>
              Exkluzívne kolekcie vo
              <br />
              <em>vysokohorskom teréne</em>
            </h2>
          </div>
          <p>
            Kompletné zostavy testované v najdrsnejších podmienkach Tatier.
            Preskúmajte celú výstroj a jednotlivé vrstvy technického systému.
          </p>
        </div>

        <div className="rig">
          <div className="rig-title">
            <span>Rig 01</span>
            <h3>Pánska zimná expedícia · Lomnický hrebeň</h3>
            <span>GORE-TEX PRO 3L · ZIMA 2025</span>
          </div>
          <div className="rig-grid">
            <div className="scene">
              <Image
                src="/img/propag_men.png"
                alt="Mužská expedičná zostava v Tatrách"
                fill
                sizes="(max-width: 700px) 100vw, 50vw"
              />
              <span className="scene-tag">
                Kompletná výstroj · 2 635 m n. m.
              </span>
            </div>
            <ProductList product={featuredProduct} />
          </div>
        </div>
      </section>

      <section className="lookbook section" id="lookbook-women">
        <div className="rig">
          <div className="rig-title">
            <span>Rig 02</span>
            <h3>Dámska aktívna zostava · Priečne sedlo</h3>
            <span>ACTIVE HYBRID · RÝCHLY POHYB</span>
          </div>
          <div className="rig-grid reverse">
            <div className="scene">
              <Image
                src="/img/propag_women.png"
                alt="Dámska trailová zostava v Tatrách"
                fill
                sizes="(max-width: 700px) 100vw, 50vw"
              />
              <span className="scene-tag">
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
export default async function Home() {
 
  return (
    <div className="site-shell">
      <Header />
      <main>
        <HeroSection />
        <LookbookSection
          featuredProduct={null}
          secondaryProduct={null}
        />
      </main>
      <Footer />
    </div>
  );
}