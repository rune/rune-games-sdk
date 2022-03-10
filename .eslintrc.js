module.exports = {
  root: true,
  env: {
    es6: true,
  },
  parserOptions: {
    sourceType: "module",
  },
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "prettier"],
  plugins: ["@typescript-eslint"],
  rules: {
    "no-throw-literal": "error",

    // Used for communicating with the game and Rune
    "no-unused-vars": "off",

    // Used to improve developer experience
    "no-console": "off"
  },
  settings: {},
  globals: {
    console: "readonly",
    exports: "readonly",
    module: "readonly",
    process: "readonly",
    Promise: "readonly",
    require: "readonly",
    setTimeout: "readonly",
    globalThis: "readonly",
    window: "readonly",
  },

  overrides: [{
    files: ["test/*.ts"],
    globals: {
      jest: "readonly",
      describe: "readonly",
      expect: "readonly",
      test: "readonly",
      beforeEach: "readonly",
      afterEach: "readonly"
    }
  }]
}
