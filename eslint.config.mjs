import eslint from "@eslint/js";
import eslintConfigGoogle from "eslint-config-google";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintConfigJSDoc from "eslint-plugin-jsdoc";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigJSDoc.configs["flat/recommended"],
  eslintConfigGoogle,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    ignores: ["eslint.config.mjs", "lib/**/*", "coverage/**/*"],
  },
  {
    rules: {
      "jsdoc/newline-after-description": "off",
      "jsdoc/require-jsdoc": ["warn", { publicOnly: true }],
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",

      "@typescript-eslint/no-require-imports": "error",

      "no-unused-vars": "off", // Turned off in favor of @typescript-eslint/no-unused-vars.
      "require-atomic-updates": "off", // This rule is so noisy and isn't useful: https://github.com/eslint/eslint/issues/11899
      "require-jsdoc": "off", // This rule is deprecated and superseded by jsdoc/require-jsdoc.
      "valid-jsdoc": "off", // This is deprecated but included in recommended configs.
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
      parserOptions: {
        ecmaVersion: "es2020",
        projectService: {
          project: "./tsconfig.json",
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
    },
  },
];
