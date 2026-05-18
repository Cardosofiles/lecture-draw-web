/**
 * Script pontual: remove a RaffleEntry de todos os usuários com role 'admin'.
 * Execute: pnpm tsx scripts/remove-admin-entries.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Find all admin users
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, email: true, name: true },
  });

  if (admins.length === 0) {
    console.log("Nenhum admin encontrado.");
    return;
  }

  console.log(`Encontrado(s) ${admins.length} admin(s):`);
  admins.forEach((a) => console.log(`  - ${a.name} <${a.email}>`));

  const adminIds = admins.map((a) => a.id);

  const { count } = await prisma.raffleEntry.deleteMany({
    where: { userId: { in: adminIds } },
  });

  console.log(`\n✅ ${count} entrada(s) de RaffleEntry removida(s) para admin(s).`);
  console.log("Os admins não aparecerão mais na lista de participantes nem serão sorteados.");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
