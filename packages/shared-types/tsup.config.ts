import { defineConfig } from "tsup";

// Types-only package. We still emit a runtime entry so the const enums and the
// re-export surface resolve cleanly from JS consumers.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
