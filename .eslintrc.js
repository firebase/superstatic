module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "google",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2017,
    project: ["tsconfig.json"],
  },
  plugins: [
    "prettier",
  ],
  rules: {
    "prettier/prettier": "error",

    "require-jsdoc": "warn",
    "prefer-arrow-callback": "error",
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-empty-function": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/no-this-alias": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/no-unsafe-assignment": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/no-unsafe-call": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/no-unsafe-member-access": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/no-unsafe-return": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/no-var-requires": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/prefer-regexp-exec": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/restrict-plus-operands": "warn", // TODO(bkendall): remove, allow to error.
        "@typescript-eslint/unbound-method": "warn", // TODO(bkendall): remove, allow to error.
      },
    },
    {
      files: ["*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  parser: "@typescript-eslint/parser",
}
