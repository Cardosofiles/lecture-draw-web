import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<
  typeof PrismaClient
>[0]);

async function main() {
  console.log("🌱 Seeding database...");

  // Palestra: 24/09/2026 às 19h (horário de Brasília, UTC-03:00).
  // O offset fica explícito para que o instante gravado no banco não dependa do
  // fuso da máquina que roda o seed.
  const eventData = {
    title: "Palestra sobre IA — Sorteio de Configuração",
    description:
      "Evento de sorteio de 5 configurações completas de PC para participantes da palestra sobre Inteligência Artificial. Aprenda sobre o futuro da IA e concorra a um setup completo!",
    eventDate: new Date("2026-09-24T19:00:00-03:00"),
    location: "Uberlândia, MG — Unitri",
    isActive: true,
  };

  // Create/refresh the raffle event — reexecutar o seed corrige data e local
  const event = await prisma.raffleEvent.upsert({
    where: { id: "seed-event-01" },
    update: eventData,
    create: { id: "seed-event-01", ...eventData },
  });

  console.log(
    `✅ RaffleEvent: ${event.title} — ${event.eventDate.toLocaleString(
      "pt-BR",
      {
        timeZone: "America/Sao_Paulo",
      },
    )} (${event.location})`,
  );

  // Seed 5 prizes
  const prizes = [
    { prizeNumber: 1, description: "PC Setup #1 — Windows 11" },
    { prizeNumber: 2, description: "PC Setup #2 — Ubuntu Linux" },
    { prizeNumber: 3, description: "PC Setup #3 — Windows 11" },
    { prizeNumber: 4, description: "PC Setup #4 — Ubuntu Linux" },
    { prizeNumber: 5, description: "PC Setup #5 — Escolha do Ganhador" },
  ];

  for (const prize of prizes) {
    await prisma.rafflePrize.upsert({
      where: { prizeNumber: prize.prizeNumber },
      update: { description: prize.description },
      create: prize,
    });
    console.log(`🏆 Prize #${prize.prizeNumber}: ${prize.description}`);
  }

  // Promote admin email if set
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (admin) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "admin", isParticipant: false },
      });
      // BR-03: admins hold no RaffleEntry, even if they signed in before the seed
      const removed = await prisma.raffleEntry.deleteMany({
        where: { userId: admin.id },
      });
      console.log(
        `👑 Promoted ${adminEmail} to admin (${removed.count} raffle entry removed)`,
      );
    } else {
      console.log(
        `ℹ️  ADMIN_EMAIL set but user not found yet — sign in first, then re-run seed`,
      );
    }
  }

  console.log("✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
