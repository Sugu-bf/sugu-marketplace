import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Guard: prevent localhost/127.0.0.1 API URLs in source code
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/localhost:\\d+\\/api|127\\.0\\.0\\.1:\\d+\\/api/]",
          message:
            "Do not use localhost API URLs. All API calls must go through API_BASE_URL from @/lib/api/config.",
        },
      ],
    },
  },
]);

export default eslintConfig;
