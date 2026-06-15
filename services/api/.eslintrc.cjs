const preset = require("@stayboost/config/eslint");
module.exports = {
  root: true,
  ...preset,
  parserOptions: { ...preset.parserOptions, project: false },
  rules: {
    ...preset.rules,
    // NestJS DI relies on parameter decorators; classes are instantiated by the
    // container, so unused-in-body constructor params are expected.
    "@typescript-eslint/no-unused-vars": [
      "error",
      { args: "none", varsIgnorePattern: "^_" },
    ],
  },
};
