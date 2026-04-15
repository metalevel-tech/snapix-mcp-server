import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.{ts,mjs,cjs}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,

      "no-unused-expressions": ["warn", { allowShortCircuit: true, allowTernary: true }],
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],

      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],

      curly: "warn",
      eqeqeq: ["warn", "always", { null: "ignore" }],

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",

      "@typescript-eslint/prefer-includes": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-empty-function": ["warn", { allow: ["arrowFunctions"] }],

      "template-curly-spacing": "error",
      "rest-spread-spacing": ["error", "never"],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "comma-dangle": ["warn", "always-multiline"],
      "newline-before-return": "error",
      "lines-around-comment": [
        "error",
        {
          beforeLineComment: false,
          beforeBlockComment: false,
          allowBlockStart: true,
          allowClassStart: true,
          allowObjectStart: true,
          allowArrayStart: true,
        },
      ],

      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "arrow-body-style": "off",
    },
  },
];
