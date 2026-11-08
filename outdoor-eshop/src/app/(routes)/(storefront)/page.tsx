import { searchProducts } from "@/features/products/composition/server";
import HomePage from "@/app/pages/home/HomePage";
import { selectLookbookProducts } from "@/features/home/application/selectLookbookProducts";

export const dynamic = "force-dynamic";

const menSlugs = [
  "krivan-pro-3l",
  "tatran-ripstop-pants",
  "tatran-summit-high",
  "vertex-alpine-40l",
];
const womenSlugs = ["tatran-alpine-shell-w", "tatran-trail-low-w"];

export default async function Home() {
  const [menCatalog, womenCatalog] = await Promise.all(
    [
      { audience: "men" as const, slugs: menSlugs },
      { audience: "women" as const, slugs: womenSlugs },
    ].map(async ({ audience, slugs }) =>
      (await Promise.all(
        slugs.map((slug) => searchProducts({ audience, slugs: [slug], limit: 1 })),
      )).flat(),
    ),
  );
  return (
    <HomePage
      menProducts={selectLookbookProducts(menCatalog, menSlugs)}
      womenProducts={selectLookbookProducts(womenCatalog, womenSlugs)}
    />
  );
}
