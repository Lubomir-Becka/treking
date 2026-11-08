"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { CatalogListingClient } from "./CatalogListingClient";
import { fetchProducts } from "../client";
import type { CatalogProductDto } from "../contracts/CatalogProductDto";

export default function CatalogSearchPage() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<"men" | "women" | "unisex" | undefined>();
  const [products, setProducts] = useState<CatalogProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const updateQuery = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      const value = params.get("audience");
      setAudience(value === "men" || value === "women" || value === "unisex" ? value : undefined);
    };
    updateQuery();
    const onSearch = (event: Event) => setQuery((event as CustomEvent<string>).detail);
    window.addEventListener("catalog-search", onSearch);
    window.addEventListener("popstate", updateQuery);
    return () => {
      window.removeEventListener("catalog-search", onSearch);
      window.removeEventListener("popstate", updateQuery);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    fetchProducts(query, controller.signal, undefined, audience)
      .then((result) => {
        setProducts(result);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Nepodarilo sa načítať katalóg produktov.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [audience, query, retryCount]);

  return (
    <>
      <Header />
      <CatalogListingClient
        products={products}
        title="Vyhľadávanie · Technická výbava"
        breadcrumb={[{ label: "Vyhľadávanie" }]}
        query={query}
        audience={audience}
        showRecommendations
        isLoading={isLoading}
        loadError={loadError}
        onRetry={() => setRetryCount((count) => count + 1)}
      />
      <Footer />
    </>
  );
}
