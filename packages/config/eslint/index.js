module.exports = {
  parserOptions: { tsconfigRootDir: __dirname, project: ["../../tsconfig.base.json"] },
  env: { es2022: true, node: true, browser: true, jest: true },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  ignorePatterns: ["dist", "build", "node_modules", "*.config.*", "*.d.ts"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
