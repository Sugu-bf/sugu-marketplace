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
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
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
  {
    // Guard: fixtures never reach production. Mock products, stores and
    // promises were served (and cached) as real content (audit P0-17).
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      "src/**/__tests__/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/test/**",
      "src/**/mocks/**",
      // Country codes and social providers still live in auth/mocks/auth.ts
      // (real configuration, misnamed); to be moved out of mocks/.
      "src/features/auth/index.ts",
      "src/features/auth/queries/auth-queries.ts",
      "src/features/auth/components/ForgotPasswordPageClient.tsx",
      "src/features/auth/components/LoginPageClient.tsx",
      "src/features/auth/components/RegisterPageClient.tsx",
      "src/features/auth/components/SocialSignInButtons.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/mocks", "**/mocks/**"],
              message: "Mocks are for tests only: production code reads the API and shows an empty state.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
