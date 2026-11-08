import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { architectureRule } from "./architecture-rules.mjs";

const linter = new Linter();
const config = [{
  files: ["**/*.{ts,tsx}"],
  languageOptions: { parser: tsParser },
  plugins: { architecture: { rules: { boundaries: architectureRule } } },
  rules: { "architecture/boundaries": "error" },
}];

function violations(filename, code) {
  return linter.verify(code, config, { filename });
}

test("enforces layer boundaries for aliases, relative imports and reexports", () => {
  assert.equal(violations("src/features/cart/domain/example.ts", 'import x from "@/shared/db/client";').length, 1);
  assert.equal(violations("src/features/cart/application/example.ts", 'export { x } from "../infrastructure/client";').length, 1);
  assert.equal(violations("src/app/pages/checkout/example.tsx", 'import("@/features/cart/infrastructure/CartApiClient");').length, 1);
  assert.equal(violations("src/app/_components/Header/example.ts", 'import x from "@/features/cart/infrastructure/CartApiClient";').length, 1);
  assert.equal(violations("src/features/products/infrastructure/example.ts", 'import x from "../../cart/infrastructure/CartApiClient";').length, 1);
  assert.equal(violations("src/features/products/infrastructure/example.ts", 'import x from "@/shared/db/client";').length, 0);
  assert.equal(violations("src/features/cart/domain/example.ts", 'import x from "drizzle-orm";').length, 1);
  assert.equal(violations("src/shared/domain/example.ts", 'import x from "@/shared/db/client";').length, 1);
});

test("keeps page presentation independent and permits shared components", () => {
  assert.equal(violations("src/app/pages/account/example.tsx", 'import x from "@/app/_components/Header/Header";').length, 0);
  assert.equal(violations("src/app/pages/account/example.tsx", 'import x from "../wishlist/WishlistPage";').length, 1);
  assert.equal(violations("src/app/pages/account/example.tsx", 'export { x } from "@/app/pages/search/example";').length, 1);
  assert.equal(violations("src/features/cart/infrastructure/example.ts", 'import x from "@/app/pages/product-detail/ProductDetailClient";').length, 1);
  assert.equal(violations("src/features/cart/application/example.ts", 'import x from "@/features/cart/domain/Cart";').length, 0);
});
