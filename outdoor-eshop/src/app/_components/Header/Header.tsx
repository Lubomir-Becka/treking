import { Logo } from "@/app/_components/Logo/Logo";
import { HeaderActions } from "./HeaderActions";
import { HeaderNavigation } from "./HeaderNavigation";
import { HeaderSearch } from "./HeaderSearch";
import styles from "./header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Logo />
      </div>
      <HeaderNavigation />
      <HeaderSearch />
      <HeaderActions />
    </header>
  );
}
