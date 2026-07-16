import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { transformWithEsbuild } from "vite";

// Lightweight mobile unit/component test layer (plan T01, §3.1 + §3.2).
//
// Approach (deviation from plan, justified by toolchain): the plan specified
// `@testing-library/react-native`, but that package transitively imports the
// real `react-native` entry, whose first line is Flow (`import typeof … from
// './index.js.flow'`). Under Vitest 4 / Vite 8 that Flow syntax cannot be
// parsed and there is no clean CJS/Flow interop. Instead we render React Native
// Web (`react-native` -> `react-native-web`) into a jsdom DOM and use the DOM
// testing library (`@testing-library/react`) to query it. react-native-web's
// compiled CJS dist has no Flow, so this avoids the whole problem with zero
// extra plugins. The `@/` alias and `tsconfigPaths` resolve app modules.
//
// RN primitive packages (e.g. `@rn-primitives/*`) ship JSX inside their
// compiled `.mjs`/`.js` dist. Vite's esbuild only parses JSX for `.tsx` by
// default, so this plugin re-transforms any node_modules `.mjs`/`.js` that
// contains JSX through esbuild's jsx loader (harmless for plain JS).
function jsxInNodeModules() {
  return {
    name: "jsx-in-node-modules",
    enforce: "pre",
    async transform(code: string, id: string) {
      if (id.includes("node_modules") && (id.endsWith(".mjs") || id.endsWith(".js"))) {
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic",
          sourcemap: false,
        });
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [tsconfigPaths(), jsxInNodeModules()],
  define: { __DEV__: JSON.stringify(true) },
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        // Inline RN primitive packages so the jsxInNodeModules plugin can
        // re-transform their JSX-in-`.mjs` dist on demand.
        inline: [/@rn-primitives/, /react-native-reanimated/, /react-native-screens/, /lucide-react-native/],
      },
    },
  },
});
