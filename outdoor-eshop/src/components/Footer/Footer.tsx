import { LogoInv } from "@/components/Logo/LogoInv";
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
        <div className={styles.column}><span className="eyebrow">Kolekcia</span><a href="#kolekcia">Pánsky hardshell</a><a href="#kolekcia">Dámska alpinistická séria</a><a href="#kolekcia">Expedičné batohy</a></div>
        <div className={styles.column}><span className="eyebrow">Podpora & servis</span><a href="#footer">Sprievodca veľkosťami</a><a href="#footer">Servis & oprava GORE-TEX</a><a href="#footer">Reklamácie</a></div>
        <div className={styles.column}><span className="eyebrow">Kontakt & eko</span><a href="#footer">Ateliér Tatranská Lomnica</a><a href="#footer">Udržateľnosť</a><a href="#footer">Zákaznícka linka</a></div>
      </div>
      <div className={styles.bottom}><span>© 2025 VERTEX Tatran. Všetky práva vyhradené.</span><span>Ochrana súkromia &nbsp; Obchodné podmienky &nbsp; Cookies</span></div>
    </footer>
  );
}
