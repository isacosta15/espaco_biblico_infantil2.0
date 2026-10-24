// Cria (ou atualiza) o usuário administrador.
// Uso: pnpm --filter @workspace/api-server run seed
// Variáveis: DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME (opcional)
import "./env-loader";
import bcrypt from "bcryptjs";
import { db, pool, usersTable } from "@workspace/db";

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Administrador";

if (!email || !password) {
  console.error("Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de rodar o seed.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

await db
  .insert(usersTable)
  .values({ name, email, password: hash, role: "admin" })
  .onConflictDoUpdate({
    target: usersTable.email,
    set: { name, password: hash, role: "admin" },
  });

console.log(`Administrador pronto: ${email}`);
await pool.end();
