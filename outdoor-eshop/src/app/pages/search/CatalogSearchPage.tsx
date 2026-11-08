"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import { CatalogListingClient } from "@/app/_components/catalog/CatalogListingClient";

export default function CatalogSearchPage() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<"men" | "women" | "unisex" | undefined>();

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

  return (
    <>
      <Header />
      <CatalogListingClient
        title="Vyhľadávanie · Technická výbava"
        breadcrumb={[{ label: "Vyhľadávanie" }]}
        query={query}
        audience={audience}
        showRecommendations
      />
      <Footer />
    </>
  );
}
