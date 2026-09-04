import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Carrega `@/shared/env` do zero com as variáveis sobrescritas.
 *
 * `createEnv` valida no import, então cada cenário precisa de um
 * `vi.resetModules()` — sem ele o segundo `import` devolveria o módulo já
 * validado do cenário anterior e o teste passaria sem exercitar nada.
 *
 * String vazia é o jeito de dizer "ausente": `emptyStringAsUndefined: true` no
 * schema trata `VAR=` como não definida, que é o caso real do `.env.example`.
 */
async function loadEnv(overrides: Record<string, string> = {}) {
  vi.resetModules()
  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value)
  }
  return import('@/shared/env')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

/**
 * O login quebrava em produção por variável ausente ou apontando para
 * localhost, e o sintoma era um 500 no callback do OAuth — longe da causa.
 * Estes testes garantem que a falha acontece no boot, com o nome da variável.
 */
describe('o schema de ambiente recusa configuração inválida', () => {
  it('aceita o .env do projeto como está', async () => {
    const { env } = await loadEnv()
    expect(env.DATABASE_URL).toMatch(/^postgres(ql)?:\/\//)
    expect(env.BETTER_AUTH_URL).toMatch(/^https?:\/\//)
  })

  it('recusa BETTER_AUTH_URL ausente em vez de cair em localhost', async () => {
    await expect(loadEnv({ BETTER_AUTH_URL: '' })).rejects.toThrow()
  })

  it('recusa BETTER_AUTH_SECRET curto demais', async () => {
    await expect(loadEnv({ BETTER_AUTH_SECRET: 'curto' })).rejects.toThrow()
  })

  it('recusa DATABASE_URL que não é PostgreSQL', async () => {
    await expect(loadEnv({ DATABASE_URL: 'mysql://user:pass@host/db' })).rejects.toThrow()
  })

  it('recusa NEXT_PUBLIC_APP_URL que não é URL absoluta', async () => {
    await expect(loadEnv({ NEXT_PUBLIC_APP_URL: 'localhost:3000' })).rejects.toThrow()
  })

  it('recusa credencial de OAuth ausente', async () => {
    await expect(loadEnv({ GOOGLE_CLIENT_ID: '' })).rejects.toThrow()
  })

  it('deixa SITE_URL ausente, que é opcional', async () => {
    const { env } = await loadEnv({ SITE_URL: '' })
    expect(env.SITE_URL).toBeUndefined()
  })
})
