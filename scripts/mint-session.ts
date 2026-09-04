/**
 * Temporary helper: mints a Better Auth session for a local user and prints the
 * signed cookie value, so a headless browser can visit the protected dashboard
 * routes. Local-only; delete when the responsiveness audit is done.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { makeSignature } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<
  typeof PrismaClient
>[0]);

async function main() {
  const wantAdmin = process.argv.includes("--admin");
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET missing");

  const user = wantAdmin
    ? await prisma.user.findFirst({ where: { role: "admin" } })
    : await prisma.user.findFirst({ where: { role: "user" } });

  if (!user) throw new Error(`no ${wantAdmin ? "admin" : "user"} found`);

  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6),
    },
  });

  const signed = `${token}.${await makeSignature(token, secret)}`;
  console.log(
    JSON.stringify({ email: user.email, role: user.role, cookie: signed }),
  );
}

main().finally(() => prisma.$disconnect());
