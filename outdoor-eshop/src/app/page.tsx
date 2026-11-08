import { searchProducts } from "@/composition/server/products";
import HomePage from "@/presentation/home/page";
import { selectLookbookProducts } from "@/application/home/selectLookbookProducts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [menCatalog, womenCatalog] = await Promise.all([
    searchProducts({ audience: "men", limit: 100 }),
    searchProducts({ audience: "women", limit: 100 }),
  ]);
  return (
    <HomePage
      menProducts={selectLookbookProducts(menCatalog, [
        "krivan-pro-3l",
        "tatran-ripstop-pants",
        "tatran-summit-high",
        "vertex-alpine-40l",
      ])}
      womenProducts={selectLookbookProducts(womenCatalog, [
        "tatran-alpine-shell-w",
        "tatran-trail-low-w",
      ])}
    />
  );
}
