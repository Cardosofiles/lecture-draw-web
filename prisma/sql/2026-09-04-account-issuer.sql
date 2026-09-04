-- Corrige o login quebrado: Better Auth >= 1.7 procura a conta OAuth por
-- (issuer, accountId) e a tabela "Account" não tem a coluna "issuer".
--
-- Sintoma exato no callback do OAuth (log do servidor):
--   [Better Auth]: Better auth was unable to query your database.
--   PrismaClientValidationError: Unknown argument `issuer`. Did you mean `user`?
--
-- A coluna é NOT NULL no schema do Better Auth, mas a tabela já tem linhas.
-- Por isso: adiciona nullable -> preenche -> só então aplica NOT NULL. Tudo em
-- uma transação, de modo que uma falha no meio não deixa a tabela num estado
-- intermediário.
--
-- Os valores de issuer são os que o próprio Better Auth 1.7.2 deriva:
--   google -> "https://accounts.google.com"  (o provider declara accountIssuer)
--   github -> "local:oauth:github"           (sem accountIssuer; usa o default
--                                             createOAuthAccountIssuer(providerId))
--
-- Como aplicar:
--   psql "$DATABASE_URL" -f prisma/sql/2026-09-04-account-issuer.sql
-- e depois `pnpm db:push` para reconciliar o restante do schema.

BEGIN;

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "issuer" TEXT;

UPDATE "Account"
   SET "issuer" = 'https://accounts.google.com'
 WHERE "providerId" = 'google'
   AND "issuer" IS NULL;

UPDATE "Account"
   SET "issuer" = 'local:oauth:github'
 WHERE "providerId" = 'github'
   AND "issuer" IS NULL;

-- Rede de segurança para qualquer provedor social acrescentado depois desta
-- migração e antes de ela rodar.
UPDATE "Account"
   SET "issuer" = 'local:oauth:' || "providerId"
 WHERE "issuer" IS NULL
   AND "providerId" <> 'credential';

UPDATE "Account"
   SET "issuer" = 'local:credential'
 WHERE "issuer" IS NULL
   AND "providerId" = 'credential';

ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;

-- É por este par que findAccountByKey busca a cada login.
CREATE INDEX IF NOT EXISTS "Account_issuer_accountId_idx"
    ON "Account" ("issuer", "accountId");

COMMIT;
