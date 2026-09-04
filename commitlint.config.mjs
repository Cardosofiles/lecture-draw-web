/**
 * Conventional Commits — https://www.conventionalcommits.org
 *
 * Formato: <type>(<scope>): <subject>
 * Exemplos:
 *   feat(hero-section): adiciona animação de entrada
 *   fix(contact): corrige validação do e-mail
 *   chore(deps): atualiza o eslint-config-next
 */

/** @type {import('@commitlint/types').UserConfig} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos.
    'type-enum': [
      2,
      'always',
      [
        'feat', // nova funcionalidade
        'fix', // correção de bug
        'docs', // documentação
        'style', // formatação (sem mudança de código)
        'refactor', // refatoração
        'perf', // performance
        'test', // testes
        'build', // build / dependências
        'ci', // configuração de CI
        'chore', // tarefas gerais
        'revert', // reverter commit
      ],
    ],
    // Subjects deste repo são escritos em PT-BR; a regra de caixa do
    // config-conventional assume inglês e rejeitaria "Corrige...".
    'subject-case': [0],
    // Permite ponto final no subject.
    'subject-full-stop': [0],
    // Limite de tamanho do cabeçalho.
    'header-max-length': [2, 'always', 100],
  },
}
