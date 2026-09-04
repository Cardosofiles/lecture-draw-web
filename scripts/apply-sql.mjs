/**
 * Aplica um arquivo .sql no banco de DATABASE_URL.
 *
 * Existe porque não há `psql` nesta máquina e a migração precisa rodar como um
 * bloco só: o arquivo abre `BEGIN` e fecha `COMMIT`, então mandar o conteúdo
 * inteiro numa única chamada preserva a transação. Quebrar em statements aqui
 * desfaria justamente a garantia que a migração depende.
 *
 * Uso: node scripts/apply-sql.mjs prisma/sql/<arquivo>.sql
 */
import { readFileSync } from 'node:fs'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('uso: node scripts/apply-sql.mjs <arquivo.sql>')
  process.exit(1)
}

// `process.loadEnvFile` lê o .env sem depender de dotenv — o mesmo caminho que
// prisma/seed.ts usa.
try {
  process.loadEnvFile('.env')
} catch {
  // .env ausente: seguimos com o ambiente já exportado (CI, Vercel).
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL não definida')
  process.exit(1)
}

const sql = readFileSync(file, 'utf8')
const client = new pg.Client({ connectionString })

await client.connect()
console.log('conectado em', new URL(connectionString).host)

try {
  await client.query(sql)
  console.log('OK:', file)
} catch (error) {
  console.error('FALHOU:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
