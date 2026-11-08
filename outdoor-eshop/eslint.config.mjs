import tsParser from "@typescript-eslint/parser";
import { architectureRule } from "./scripts/architecture-rules.mjs";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-console": "warn",
      "no-constant-condition": "error",
      "architecture/boundaries": "error",
    },
    plugins: {
      architecture: { rules: { boundaries: architectureRule } },
    },
  },
];
