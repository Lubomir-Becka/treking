import Image from "next/image";
import styles from "./logo.module.css";
export function LogoInv() {
  return (
    <a href="/" className={`${styles.logo} ${styles.inverted}`} aria-label="VERTEX Tatran – domov">
      <Image 
        src="/img/logo-inv.svg" 
        alt="VERTEX Tatran Logo" 
        width={42} 
        height={27} 
        priority 
      />
      <span>VERTEX<small>TATRAN</small></span>
    </a>
  );
}