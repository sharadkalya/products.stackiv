import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "single", { avoidEscape: true, allowTemplateLiterals: true }],
            "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }],
            indent: ["error", 4, { SwitchCase: 1 }],
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            "object-curly-spacing": ["error", "always"],
            "comma-dangle": ["error", "always-multiline"],
            "linebreak-style": ["error", "unix"],
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "camelcase": ["error", { properties: "always" }],
            "import/order": [
                "error",
                {
                    "groups": [
                        "builtin",
                        "external",
                        "internal",
                        "parent",
                        "sibling",
                        "index"
                    ],
                    "newlines-between": "always",
                    "alphabetize": {
                        "order": "asc",
                        "caseInsensitive": true
                    }
                }
            ]
        }
    },
];

export default eslintConfig;
