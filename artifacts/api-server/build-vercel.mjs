// Empacota a API Express em um único arquivo (artifacts/api-server/dist/vercel/index.cjs),
// carregado pela função serverless api/index.js da Vercel.
//
// Por que empacotar? Os pacotes internos (@workspace/db, @workspace/api-zod) são
// código-fonte TypeScript ligado por symlink; a Vercel não os resolve em runtime.
// O esbuild embute tudo (incluindo dependências) em um arquivo só.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { mkdir } from "node:fs/promises";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

const outfile = path.resolve(artifactDir, "dist/vercel/index.cjs");

await mkdir(path.dirname(outfile), { recursive: true });

await esbuild({
  entryPoints: [path.resolve(artifactDir, "src/vercel.ts")],
  outfile,
  platform: "node",
  target: "node22",
  format: "cjs",
  bundle: true,
  logLevel: "info",
  // Módulo opcional do `pg` (binding nativo). Não é necessário.
  external: ["pg-native"],
  // Faz `require(...)` devolver o app Express diretamente.
  footer: { js: "module.exports = module.exports.default;" },
});
