// Entrada usada apenas no deploy da Vercel (função serverless).
// Não chama app.listen(): a Vercel invoca o app Express diretamente.
import app from "./app";

export default app;
