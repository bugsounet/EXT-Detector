const globals = require("globals");
const { configs: eslintConfigs } = require("@eslint/js");
const eslintPluginImport = require("eslint-plugin-import");
const eslintPluginStylistic = require("@stylistic/eslint-plugin");

const config = [
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        config: true,
        Log: true,
        MM: true,
        Module: true,
        moment: true,
        document: true,
        windows: true,
        configMerge: true
      }
    },
    plugins: {
      ...eslintPluginStylistic.configs["all-flat"].plugins,
      import: eslintPluginImport
    },
    rules: {
      ...eslintConfigs.all.rules,
      ...eslintPluginImport.configs.recommended.rules,
      ...eslintPluginStylistic.configs["all-flat"].rules,
      eqeqeq: "error",
      "import/order": "error",
      "import/newline-after-import": "error",
      "no-param-reassign": "error",
      "no-prototype-builtins": "off",
      "no-throw-literal": "error",
      "no-unused-vars": "off",
      "no-useless-return": "error",
      "object-shorthand": ["error", "methods"],
      "prefer-template": "error",
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/brace-style": "off",
      "@stylistic/comma-dangle": ["error", "never"],
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/function-paren-newline": ["error", "consistent"],
      "@stylistic/implicit-arrow-linebreak": ["error", "beside"],
      "@stylistic/max-statements-per-line": ["error", { max: 2 }],
      "@stylistic/multiline-ternary": ["error", "always-multiline"],
      "@stylistic/newline-per-chained-call": ["error", { ignoreChainWithDepth: 4 }],
      "@stylistic/no-extra-parens": "off",
      "@stylistic/no-tabs": "off",
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/operator-linebreak": ["error", "before"],
      "@stylistic/padded-blocks": "off",
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/space-before-function-paren": ["error", "always"],
      "@stylistic/spaced-comment": "off",

      /* bugsounet rules */
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          json: "always" // ignore json require (display EXT version and rev date)
        }
      ],
      "@stylistic/indent": ["error", 2], // indent 2 spaces
      "default-case": "off",
      "no-plusplus": "off",
      "no-console": "off",
      "no-ternary": "off",
      "capitalized-comments": "off",
      "consistent-this": "off",
      "func-style": "off",
      "init-declarations": "off",
      "line-comment-position": "off",
      "max-lines-per-function": ["error", 100],
      "max-statements": ["error", 50],
      "no-await-in-loop": "off",
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-undef": "warn",
      "one-var": "off",
      "prefer-destructuring": "off",
      "sort-keys": "off",
      strict: "off",
      "new-cap": "off",
      "@stylistic/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }]
    }
  }
];

/*
 * Set debug to true for testing purposes.
 * Since some plugins have not yet been optimized for the flat config,
 * we will be able to optimize this file in the future. It can be helpful
 * to write the ESLint config to a file and compare it after changes.
 */
const debug = false;

if (debug === true) {
  const FileSystem = require("fs");
  FileSystem.writeFile("eslint-config-DEBUG.json", JSON.stringify(config, null, 2), (error) => {
    if (error) {
      throw error;
    }
  });
}

module.exports = config;
