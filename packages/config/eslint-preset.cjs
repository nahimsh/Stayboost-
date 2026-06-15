/**
 * Shared ESLint config (classic). Extended by every workspace package.
 * Enforces the TypeScript rules in CLAUDE.md (no `any`, no unused, etc.).
 */
module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  env: { es2022: true, node: true, browser: true },
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-non-null-assertion": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-restricted-syntax": [
      "error",
      {
        selector: "TSEnumDeclaration[const=false]",
        message: "Prefer union types or `as const` objects over runtime enums.",
      },
    ],
  },
  ignorePatterns: ["dist", ".next", "node_modules", "coverage", "*.cjs"],
};
