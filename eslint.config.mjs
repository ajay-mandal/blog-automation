// @ts-check
import tsPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import nextConfig from "eslint-config-next"
import prettierConfig from "eslint-config-prettier"

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // Next.js recommended flat config (includes React, React Hooks, @next/next)
  ...nextConfig,

  // TypeScript-specific rules block — plugin and parser must be co-located
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      // Disallow `any` — strict mode equivalent
      "@typescript-eslint/no-explicit-any": "error",
      // Prefer `type` over `interface` for plain object shapes
      "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
      // Enforce `import type` for type-only imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Disallow unused variables (prefix _ to exempt)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // General quality rules (applies to all JS/TS files)
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Turns off all formatting rules that conflict with Prettier — must be last
  prettierConfig,

  // Ignore build outputs and generated files
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "prisma/migrations/**",
      "src/generated/**",
      "public/**",
      ".agents/**",
      "docs/**",
    ],
  },
]

export default config
