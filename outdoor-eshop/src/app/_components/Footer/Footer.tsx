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
      </div>
      <div className={styles.bottom}>
        <span>© 2025 VERTEX Tatran. Všetky práva vyhradené.</span>
      </div>
    </footer>
  );
}
