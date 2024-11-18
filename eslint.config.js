import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import path from "path";

const gitignorePath = path.resolve(".gitignore");

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ["src/**/*", "scripts/**/*"],
    languageOptions: { globals: globals.node },
  },
  includeIgnoreFile(gitignorePath),
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { caughtErrorsIgnorePattern: "^_" }],
    },
  },
];
