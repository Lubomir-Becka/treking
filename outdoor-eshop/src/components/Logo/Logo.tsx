import Image from "next/image";
import styles from "./logo.module.css";

export function Logo() {
  return (
    <a href="/" className={styles.logo} aria-label="VERTEX Tatran – domov">
      <Image 
        src="/img/logo.svg" 
        alt="VERTEX Tatran Logo" 
        width={42} 
        height={27} 
        priority 
      />
      <span>VERTEX<small>TATRAN</small></span>
    </a>
  );
}