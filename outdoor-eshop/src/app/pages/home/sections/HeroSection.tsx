import Image from "next/image";
import styles from "../home.module.css";

export function HeroSection() {
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
