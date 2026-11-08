import { LogoInv } from "@/app/_components/Logo/LogoInv";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className={styles.main}>
        <div className={styles.brand}>
          <LogoInv />
          <p>Technická výbava pre tých,<br />ktorí idú ďalej.</p>
          <span className={styles.partner}>Oficiálny partner Horskej záchrannej služby</span>
        </div>
        <div className={styles.column}>
          <span className="eyebrow">Kolekcia</span>
          <a href="/collections/men">Pánska kolekcia</a>
          <a href="/collections/women">Dámska kolekcia</a>
          <a href="/search">Všetky produkty</a>
        </div>
        <div className={styles.column}>
          <span className="eyebrow">Podpora & servis</span>
          <span>Sprievodca veľkosťami</span>
          <span>Servis & oprava GORE-TEX</span>
          <span>Reklamácie</span>
        </div>
        <div className={styles.column}>
          <span className="eyebrow">Kontakt & eko</span>
          <span>Ateliér Tatranská Lomnica</span>
          <span>Udržateľnosť</span>
          <span>Zákaznícka linka</span>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2025 VERTEX Tatran. Všetky práva vyhradené.</span>
        <span>Ochrana súkromia &nbsp; Obchodné podmienky &nbsp; Cookies</span>
      </div>
    </footer>
  );
}
