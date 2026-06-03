import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  clean: true,

  format: "esm",
  sourcemap: true,
  dts: { sourcemap: true },

  platform: "node",
  target: "node24",
});
