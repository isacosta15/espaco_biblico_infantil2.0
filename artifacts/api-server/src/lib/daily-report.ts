import { db, attendanceTable, childrenTable, dailyReportsTable } from "@workspace/db";
import { eq, and, count, isNull } from "drizzle-orm";

/**
 * Recalcula o relatório diário de uma data, contando apenas crianças ativas
 * (não excluídas).
 */
export async function updateDailyReport(date: string): Promise<void> {
  const girlsCount = await db.select({ cnt: count() }).from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(and(eq(attendanceTable.attendanceDate, date), eq(childrenTable.gender, "F"), isNull(childrenTable.deletedAt)));
  const boysCount = await db.select({ cnt: count() }).from(attendanceTable)
    .innerJoin(childrenTable, eq(attendanceTable.childId, childrenTable.id))
    .where(and(eq(attendanceTable.attendanceDate, date), eq(childrenTable.gender, "M"), isNull(childrenTable.deletedAt)));

  const totalGirls = Number(girlsCount[0]?.cnt ?? 0);
  const totalBoys = Number(boysCount[0]?.cnt ?? 0);
  const totalChildren = totalGirls + totalBoys;

  await db.insert(dailyReportsTable).values({
    reportDate: date,
    totalGirls,
    totalBoys,
    totalChildren,
  }).onConflictDoUpdate({
    target: dailyReportsTable.reportDate,
    set: { totalGirls, totalBoys, totalChildren },
  });
}

/**
 * Recalcula os relatórios de todos os dias em que a criança teve presença.
 * Deve ser chamado ao excluir ou restaurar uma criança, para que os totais
 * (relatórios, gráfico semanal e média) acompanhem a mudança.
 */
export async function refreshReportsForChild(childId: number): Promise<void> {
  const dates = await db
    .selectDistinct({ date: attendanceTable.attendanceDate })
    .from(attendanceTable)
    .where(eq(attendanceTable.childId, childId));
  for (const { date } of dates) {
    await updateDailyReport(date);
  }
}
