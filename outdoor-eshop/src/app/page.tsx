import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

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
export default async function Home() {
 

  return (
    <div className="site-shell">
      <Header />
      <main>
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
}