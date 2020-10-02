module.exports = {
  "root": true,
  "extends": [
    "eslint:recommended",
    "google",
    "eslint-config-prettier"
  ],
  "env": {
    "es6": true,
    "node": true,
  },
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2017
  },
  "globals": {
    "require_local": "false"
  },
  plugins: ["prettier"],
  "rules": {
    "prettier/prettier": "error",

    "space-before-function-paren": ["error", {anonymous: "never", named: "never", asyncArrow: "always"}],
    "require-jsdoc": "warn",
  }
}
