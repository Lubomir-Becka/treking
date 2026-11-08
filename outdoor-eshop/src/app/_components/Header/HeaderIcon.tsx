import Image from "next/image";
import styles from "./header.module.css";

type IconName = "chevron-down" | "heart" | "search" | "shopping-cart" | "user-round";

export function HeaderIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <Image
      className={styles.icon}
      src={`/img/ui/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
    />
  );
}
