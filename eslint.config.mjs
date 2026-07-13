import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Keep purity checking visible while preserving the existing server-render timing behavior.
  // A dedicated behavioral refactor may address this warning later.
  {
    files: ["src/app/page.tsx"],
    rules: {
      "react-hooks/purity": "warn",
    },
  },
  // Keep effect-state checking visible while preserving playback-history timing during modernization.
  // A dedicated behavioral refactor may address this warning later.
  {
    files: ["src/components/playback-history-sections.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Keep ref checking visible while preserving the existing PlayerProvider synchronization behavior.
  // A dedicated behavioral refactor may address this warning later.
  {
    files: ["src/components/player-provider.tsx"],
    rules: {
      "react-hooks/refs": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
