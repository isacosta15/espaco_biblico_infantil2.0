// Função serverless da Vercel: todas as requisições /api/* chegam aqui
// (ver "rewrites" no vercel.json) e são tratadas pelo app Express.
//
// O bundle abaixo é gerado durante o build (pnpm --filter @workspace/api-server run build:vercel)
// e não é versionado no Git.
module.exports = require("../artifacts/api-server/dist/vercel/index.cjs");
