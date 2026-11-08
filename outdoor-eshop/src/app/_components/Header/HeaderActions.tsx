"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchCart } from "@/features/cart/composition/client";
import { fetchSessionStatus, logout as logoutRequest } from "@/features/session/composition/client";
import { HeaderIcon } from "./HeaderIcon";
import styles from "./header.module.css";

export function HeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "anonymous" | "error"
  >("loading");
  const [cartCount, setCartCount] = useState(0);
  const [cartError, setCartError] = useState(false);

  useEffect(() => {
    let active = true;

    const updateCartCount = async () => {
      try {
        const cart = await fetchCart();
        if (!cart.items.every((item) => Number.isSafeInteger(item.quantity) && item.quantity > 0)) {
          throw new Error("Cart response is invalid.");
        }
        if (!active) return;
        setCartCount(cart.items.reduce((total, item) => total + item.quantity, 0));
        setCartError(false);
      } catch {
        if (active) setCartError(true);
      }
    };

    updateCartCount();
    window.addEventListener("vertex-cart-updated", updateCartCount);
    return () => {
      active = false;
      window.removeEventListener("vertex-cart-updated", updateCartCount);
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchSessionStatus()
      .then((authenticated) => {
        if (active) {
          setAuthStatus(authenticated ? "authenticated" : "anonymous");
        }
      })
      .catch(() => {
        if (active) setAuthStatus("error");
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function logout() {
    setLogoutError(null);
    try {
      await logoutRequest();
      setAuthStatus("anonymous");
      router.push("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Odhlásenie sa nepodarilo.",
      );
    }
  }

  return (
    <div className={styles.actions}>
      <Link className={styles.actionLink} href="/wishlist" aria-label="Obľúbené">
        <HeaderIcon name="heart" size={19} />
      </Link>
      <Link className={styles.actionLink} href="/checkout/cart" aria-label="Košík">
        <HeaderIcon name="shopping-cart" size={20} />
        <b>{cartCount}</b>
      </Link>
      {cartError && <span role="alert">Počet položiek v košíku sa nepodarilo načítať.</span>}
      {authStatus === "authenticated" ? (
        <details className={styles.accountMenu}>
          <summary className={styles.account} aria-label="Zákaznícky účet">
            <HeaderIcon name="user-round" size={18} />
            <span>Účet</span>
          </summary>
          <div className={styles.accountDropdown}>
            <Link href="/account">Môj účet</Link>
            <button type="button" onClick={logout}>Odhlásiť sa</button>
            {logoutError && <p role="alert">{logoutError}</p>}
          </div>
        </details>
      ) : authStatus === "anonymous" ? (
        <div className={styles.authLinks}>
          <Link href="/login">Účet</Link>
        </div>
      ) : authStatus === "error" ? (
        <span className={styles.accountLoading} role="status" aria-label="Stav účtu sa nepodarilo načítať" />
      ) : (
        <span className={styles.accountLoading} aria-hidden="true" />
      )}
    </div>
  );
}
