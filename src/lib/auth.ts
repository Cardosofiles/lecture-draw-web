import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
      isParticipant: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-enroll new users — but admins are excluded from the raffle.
          // `role` is always its "user" default at create time (the seed promotes
          // the admin afterwards), so the admin has to be spotted by e-mail.
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
          if (adminEmail && user.email.toLowerCase() === adminEmail) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "admin", isParticipant: false },
            });
            return;
          }
          // Upsert, not create-and-swallow: a duplicate-key INSERT aborts the
          // surrounding Postgres transaction, so catching the error in JS is not
          // enough to make a retried OAuth callback safe.
          await prisma.raffleEntry.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
          });
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
