module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:jsdoc/recommended",
    "google",
    "prettier",
    "prettier/@typescript-eslint",
  ],
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2017,
    project: ["tsconfig.json", "tsconfig.dev.json"],
  },
  plugins: ["prettier", "@typescript-eslint", "jsdoc"],
  rules: {
    "jsdoc/newline-after-description": "off",
    "jsdoc/require-jsdoc": ["warn", { publicOnly: true }],
    "jsdoc/require-param-type": "off",
    "jsdoc/require-returns-type": "off",
    "prefer-arrow-callback": "error",
    "prettier/prettier": "error",

    "require-atomic-updates": "off", // This rule is so noisy and isn't useful: https://github.com/eslint/eslint/issues/11899
    "require-jsdoc": "off", // This rule is deprecated and superseded by jsdoc/require-jsdoc.
    "valid-jsdoc": "off", // This is deprecated but included in recommended configs.
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
        "@typescript-eslint/no-use-before-define": "warn", // TODO(bkendall): remove, allow to error.
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
  settings: {
    jsdoc: {
      tagNamePreference: {
        returns: "return",
      },
    },
  },
};
