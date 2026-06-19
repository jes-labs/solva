import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // The server entry is run with node; mark the shebang so it stays executable.
  banner: { js: "#!/usr/bin/env node" },
});
