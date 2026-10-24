// Empacota e executa src/import-criancas.ts (os pacotes @workspace/* são TypeScript,
// então passam pelo esbuild antes de rodar no Node).
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.resolve(artifactDir, "dist/import-criancas.mjs");

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/import-criancas.ts")],
  outfile,
  platform: "node",
  target: "node22",
  format: "esm",
  bundle: true,
  logLevel: "warning",
  external: ["pg-native"],
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
const require = __cr(import.meta.url);`,
  },
});

await import(pathToFileURL(outfile).href);
