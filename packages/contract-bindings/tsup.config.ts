import { defineConfig } from "tsup";

// Only the hand-written wrapper is built here. The generated client in
// src/generated is produced by `just gen-bindings` and re-exported at runtime;
// it is not part of this build graph because it does not exist in a clean tree.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
