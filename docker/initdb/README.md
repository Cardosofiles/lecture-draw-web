# Dumps de inicialização

Arquivos aqui rodam **uma única vez**, no primeiro boot de um volume vazio.
São ignorados se o volume `postgres-data` já tiver dados.

Formatos aceitos pelo entrypoint do Postgres: `.sql`, `.sql.gz`, `.sh`.

## Tirar um dump do Neon

```bash
pg_dump "$DATABASE_URL_DO_NEON" --no-owner --no-acl -f docker/initdb/10-dump.sql
```

## Restaurar em um banco que já subiu

O entrypoint só roda no primeiro boot. Para recarregar depois:

```bash
docker compose down -v && docker compose up -d   # recria do zero
# ou, sem apagar o volume:
docker compose exec -T postgres psql -U lecture -d lecture_draw < docker/initdb/10-dump.sql
```

## Sem dump nenhum

Não precisa de dump para trabalhar: `pnpm db:push && pnpm db:seed` monta o
schema e os dados iniciais em um banco vazio.
