"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// BR-27: DROP TABLE, DROP DATABASE, TRUNCATE and ALTER ... DROP are blocked.
// The keywords Postgres treats as optional (TABLE, COLUMN) must stay optional
// here too, otherwise `TRUNCATE "User"` walks straight past the guard.
const BLOCKED_PATTERNS = [
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|SEQUENCE|TYPE|FUNCTION)\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b[\s\S]*\bDROP\b/i,
];

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error(
      "Acesso negado: somente administradores podem executar queries.",
    );
  }
  return session;
}

function isReadQuery(sql: string): boolean {
  const q = sql.trim().toUpperCase();
  return q.startsWith("SELECT") || q.startsWith("WITH");
}

function translatePrismaError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("relation") && msg.includes("does not exist"))
    return "Tabela não encontrada. Verifique o nome no esquema.";
  if (msg.includes("column") && msg.includes("does not exist"))
    return "Coluna não encontrada. Verifique o nome da coluna.";
  if (msg.includes("syntax error"))
    return "Erro de sintaxe SQL. Verifique a query.";
  if (msg.includes("permission denied"))
    return "Permissão negada para executar esta operação.";
  if (msg.includes("violates foreign key"))
    return "Violação de chave estrangeira. Há registros dependentes que impedem a operação.";
  if (msg.includes("duplicate key") || msg.includes("unique constraint"))
    return "Registro duplicado. Já existe um valor com esta chave única.";
  if (msg.includes("null value") && msg.includes("not-null"))
    return "Campo obrigatório não pode ser nulo.";
  if (msg.includes("value too long"))
    return "Valor muito longo para o campo especificado.";
  if (msg.includes("division by zero"))
    return "Divisão por zero detectada na query.";
  if (msg.includes("invalid input syntax"))
    return "Valor com formato inválido para o tipo de dado esperado.";
  if (msg.includes("out of range"))
    return "Valor fora do intervalo permitido para o tipo de dado.";
  if (msg.includes("deadlock detected"))
    return "Deadlock detectado. Tente executar a query novamente.";
  if (msg.includes("canceling statement due to conflict"))
    return "Query cancelada por conflito com outra operação. Tente novamente.";
  if (msg.includes("connection") && msg.includes("refused"))
    return "Não foi possível conectar ao banco de dados.";
  return `Erro ao executar query: ${msg}`;
}

function buildSuccessMessage(sql: string, rowCount: number): string {
  const q = sql.trim().toUpperCase();
  const n = rowCount;
  if (q.startsWith("SELECT"))
    return `${n} ${n === 1 ? "linha retornada" : "linhas retornadas"}`;
  if (q.startsWith("INSERT"))
    return `${n} ${n === 1 ? "registro inserido" : "registros inseridos"} com sucesso`;
  if (q.startsWith("UPDATE"))
    return `${n} ${n === 1 ? "registro atualizado" : "registros atualizados"} com sucesso`;
  if (q.startsWith("DELETE"))
    return `${n} ${n === 1 ? "registro deletado" : "registros deletados"} com sucesso`;
  if (q.startsWith("CREATE")) return "Objeto criado com sucesso";
  if (q.startsWith("ALTER")) return "Estrutura alterada com sucesso";
  if (q.startsWith("WITH"))
    return `${n} ${n === 1 ? "linha retornada" : "linhas retornadas"}`;
  if (q.startsWith("BEGIN") || q.startsWith("COMMIT"))
    return `Transação executada · ${n} ${n === 1 ? "linha afetada" : "linhas afetadas"}`;
  return "Query executada com sucesso";
}

export async function executeSQL(sql: string) {
  const session = await requireAdmin();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sql)) {
      throw new Error(`Operação bloqueada por segurança: ${pattern.source}`);
    }
  }
  const start = Date.now();
  let rows: Record<string, unknown>[] = [];
  let error: string | null = null;
  let rowCount: number | null = null;
  try {
    if (isReadQuery(sql)) {
      const result = await prisma.$queryRawUnsafe(sql);
      rows = (result as Record<string, unknown>[]) ?? [];
      rowCount = rows.length;
    } else {
      const affected = await prisma.$executeRawUnsafe(sql);
      rows = [];
      rowCount = affected;
    }
  } catch (e) {
    error = translatePrismaError(e);
  }
  const duration = Date.now() - start;
  try {
    await prisma.queryLog.create({
      data: { userId: session.user.id, sql, duration, rowCount, error },
    });
  } catch (logError) {
    console.warn("[sql-console] Falha ao registrar query log:", logError);
  }
  if (error) throw new Error(error);
  return {
    rows,
    duration,
    rowCount,
    message: buildSuccessMessage(sql, rowCount ?? 0),
  };
}

export async function getSchemaBrowser() {
  await requireAdmin();
  const columns = await prisma.$queryRaw<
    Array<{ table_name: string; column_name: string; data_type: string }>
  >`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;
  const schema: Record<string, Array<{ column: string; type: string }>> = {};
  for (const row of columns) {
    if (!schema[row.table_name]) schema[row.table_name] = [];
    schema[row.table_name].push({
      column: row.column_name,
      type: row.data_type,
    });
  }
  return schema;
}

export async function getQueryHistory() {
  const session = await requireAdmin();
  return prisma.queryLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      sql: true,
      duration: true,
      rowCount: true,
      error: true,
      createdAt: true,
    },
  });
}
