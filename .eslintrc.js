module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "google",
    "eslint-config-prettier",
  ],
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2017
  },
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",

    "require-jsdoc": "warn",
    "prefer-arrow-callback": "error",
  }
}
