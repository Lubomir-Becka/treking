"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo/Logo";
import styles from "./header.module.css";

function Icon({ children }: { children: React.ReactNode }) {
  return <span className={styles.icon} aria-hidden="true">{children}</span>;
}

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = async () => {
      const response = await fetch("/api/cart");
      if (!response.ok) return;
      const payload = (await response.json()) as {
        data?: { items?: Array<{ quantity: number }> };
      };
      setCartCount(
        payload.data?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0,
      );
    };

    updateCartCount();
    window.addEventListener("vertex-cart-updated", updateCartCount);
    return () => window.removeEventListener("vertex-cart-updated", updateCartCount);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    router.push(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
    window.dispatchEvent(new CustomEvent("catalog-search", { detail: trimmedQuery }));
  }

  return (
    <header className={styles.header}>
      <Logo />
      <nav className={styles.navigation} aria-label="Hlavná navigácia">
        <Link href="/collections/men">Páni <span>⌄</span></Link>
        <Link href="/collections/women">Dámy <span>⌄</span></Link>
        <Link href="/categories/kids">Deti <span>⌄</span></Link>
      </nav>
      <form className={styles.search} onSubmit={submitSearch}>
        <Icon>⌕</Icon>
        <input aria-label="Hľadať výbavu" placeholder="Hľadať výbavu..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </form>
      <div className={styles.actions}>
        <Link className={styles.actionLink} href="/wishlist" aria-label="Obľúbené"><Icon>♡</Icon><b>0</b></Link>
        <Link className={styles.actionLink} href="/checkout/cart" aria-label="Košík"><Icon>♧</Icon><b>{cartCount}</b></Link>
        <Link className={styles.account} href="/account" aria-label="Zákaznícky účet"><Icon>♙</Icon><span>Účet</span></Link>
      </div>
    </header>
  );
}
