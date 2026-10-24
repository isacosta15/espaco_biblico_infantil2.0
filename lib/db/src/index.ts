import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Em ambiente serverless (Vercel) cada instância da função abre o próprio pool,
// então mantemos poucas conexões por instância para não esgotar o limite do banco.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? (process.env.VERCEL ? 3 : 10)),
  idleTimeoutMillis: 10_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
