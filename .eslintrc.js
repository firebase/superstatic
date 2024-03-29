module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:jsdoc/recommended",
    "google",
    "plugin:prettier/recommended",
  ],
  env: {
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "ES2020",
    project: ["tsconfig.json", "tsconfig.dev.json"],
  },
  plugins: ["@typescript-eslint", "jsdoc"],
  rules: {
    "jsdoc/newline-after-description": "off",
    "jsdoc/require-jsdoc": ["warn", { publicOnly: true }],
    "jsdoc/require-param-type": "off",
    "jsdoc/require-returns-type": "off",

    "require-atomic-updates": "off", // This rule is so noisy and isn't useful: https://github.com/eslint/eslint/issues/11899
    "require-jsdoc": "off", // This rule is deprecated and superseded by jsdoc/require-jsdoc.
    "valid-jsdoc": "off", // This is deprecated but included in recommended configs.
  },
  overrides: [
    {
      files: ["*.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-argument": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-assignment": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-call": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-member-access": "warn", // TODO(bkendall): remove allow to error.
      },
    },
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-this-alias": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-argument": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-assignment": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-call": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-member-access": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-unsafe-return": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/no-var-requires": "warn", // TODO(bkendall): remove allow to error.
        "@typescript-eslint/unbound-method": "warn", // TODO(bkendall): remove allow to error.
      },
    },
    {
      files: ["*.spec.*"],
      env: {
        mocha: true,
      },
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
