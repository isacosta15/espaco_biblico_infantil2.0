// Importa as crianças de artifacts/api-server/data/criancas.json para o banco.
// Seguro para rodar mais de uma vez: quem já existe (mesmo nome + nascimento) é ignorado.
//
// Uso:  pnpm --filter @workspace/api-server run import:criancas
// Simular sem gravar nada:  defina SIMULAR=1 antes de rodar.
import "./env-loader";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { db, pool, childrenTable, congregationsTable } from "@workspace/db";

interface Registro {
  fullName: string;
  birthDate: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  congregation: string | null;
  foodRestriction: boolean;
  foodRestrictionDescription: string | null;
  autism: boolean;
  observations: string | null;
}

const simular = process.env.SIMULAR === "1";
const aqui = path.dirname(fileURLToPath(import.meta.url));
const arquivo =
  process.env.CRIANCAS_JSON ?? path.resolve(aqui, "../data/criancas.json");

const registros: Registro[] = JSON.parse(readFileSync(arquivo, "utf8"));

registros.forEach((r, i) => {
  const linha = `registro ${i + 1} (${r.fullName ?? "sem nome"})`;
  if (!r.fullName || !r.guardianName || !r.guardianPhone) {
    throw new Error(`${linha}: nome, responsável e telefone são obrigatórios.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.birthDate)) {
    throw new Error(`${linha}: data de nascimento inválida (${r.birthDate}).`);
  }
  if (r.gender !== "M" && r.gender !== "F") {
    throw new Error(`${linha}: sexo deve ser M ou F (veio ${r.gender}).`);
  }
});

console.log(
  `${simular ? "[SIMULAÇÃO] " : ""}Lendo ${registros.length} crianças de ${arquivo}`,
);

let congregacoesCriadas = 0;
let criadas = 0;
let jaExistiam = 0;

await db.transaction(async (tx) => {
  // 1) Congregações (cria só as que ainda não existem)
  const idPorNome = new Map<string, number>();
  for (const c of await tx.select().from(congregationsTable)) {
    idPorNome.set(c.name, c.id);
  }
  const nomes = [
    ...new Set(registros.map((r) => r.congregation).filter((n): n is string => !!n)),
  ];
  for (const nome of nomes) {
    if (idPorNome.has(nome)) continue;
    congregacoesCriadas++;
    if (simular) continue;
    const [nova] = await tx
      .insert(congregationsTable)
      .values({ name: nome })
      .returning();
    idPorNome.set(nome, nova.id);
  }

  // 2) Crianças
  for (const r of registros) {
    const [existente] = await tx
      .select({ id: childrenTable.id })
      .from(childrenTable)
      .where(
        and(
          eq(childrenTable.fullName, r.fullName),
          eq(childrenTable.birthDate, r.birthDate),
        ),
      );
    if (existente) {
      jaExistiam++;
      continue;
    }
    criadas++;
    if (simular) continue;
    await tx.insert(childrenTable).values({
      fullName: r.fullName,
      birthDate: r.birthDate,
      gender: r.gender as "M" | "F",
      guardianName: r.guardianName,
      guardianPhone: r.guardianPhone,
      foodRestriction: r.foodRestriction,
      foodRestrictionDescription: r.foodRestrictionDescription,
      autism: r.autism,
      observations: r.observations,
      congregationId: r.congregation ? idPorNome.get(r.congregation) : undefined,
    });
  }
});

console.log(
  `${simular ? "[SIMULAÇÃO] Seriam criadas" : "Criadas"}: ${criadas} crianças e ${congregacoesCriadas} congregações. Já existiam (ignoradas): ${jaExistiam}.`,
);
await pool.end();
