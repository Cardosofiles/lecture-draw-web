import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getAuthTables } from 'better-auth/db'

const root = path.join(import.meta.dirname, '..', '..')
const schema = readFileSync(path.join(root, 'prisma', 'schema.prisma'), 'utf8')

/**
 * Extrai os nomes de campo declarados num `model X { … }` do schema.prisma.
 *
 * Um parser de verdade seria exagero: só precisamos do primeiro identificador
 * de cada linha do bloco, ignorando comentários, atributos de bloco (`@@index`)
 * e a chave de fechamento.
 */
function prismaModelFields(model: string): string[] {
  const block = new RegExp(`^model\\s+${model}\\s*\\{([\\s\\S]*?)^\\}`, 'm').exec(schema)
  if (!block) return []
  return block[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//') && !line.startsWith('@@'))
    .map((line) => line.split(/\s+/)[0])
}

/** `user` → `User`, `session` → `Session`. */
const toPrismaModel = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

/**
 * O Better Auth acrescenta colunas entre minor versions — a 1.7 introduziu
 * `Account.issuer`, e a ausência dela derrubou o login inteiro: `findAccountByKey`
 * busca por (issuer, accountId) e o Prisma respondia
 * `PrismaClientValidationError: Unknown argument 'issuer'` no callback do OAuth,
 * *depois* de o usuário já ter autorizado no provedor.
 *
 * Nada no `pnpm build` cobre esse desencontro: ele só aparece em runtime, no
 * meio do fluxo de autenticação. Este teste compara o schema que a versão
 * instalada exige com o que o `schema.prisma` declara, e é a rede que segura a
 * próxima atualização do Better Auth.
 */
describe('prisma/schema.prisma cobre o schema exigido pelo Better Auth instalado', () => {
  const tables = getAuthTables({})

  for (const [modelName, table] of Object.entries(tables)) {
    const prismaModel = toPrismaModel(modelName)

    it(`model ${prismaModel} declara todos os campos de "${table.modelName}"`, () => {
      const declared = prismaModelFields(prismaModel)
      expect(
        declared.length,
        `model ${prismaModel} não existe em prisma/schema.prisma`
      ).toBeGreaterThan(0)

      const missing = Object.keys(table.fields).filter((field) => !declared.includes(field))

      expect(
        missing,
        `${prismaModel} não tem ${missing.join(', ')} — o Better Auth consulta ` +
          `esses campos e o Prisma rejeita a query em runtime. Rode ` +
          `\`npx @better-auth/cli generate\` e aplique a migração.`
      ).toEqual([])
    })
  }
})
