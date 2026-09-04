/**
 * lint-staged — roda apenas nos arquivos staged, antes do commit.
 *
 * - ESLint corrige código (JS/TS/JSX/TSX) e falha se sobrar erro.
 * - Prettier formata tudo o que ele entende.
 *
 * `typecheck` NÃO entra aqui: o tsc é project-wide e não funciona por arquivo
 * isolado — checar só os staged daria falsos positivos e falsos negativos. Type
 * checking roda no pre-push e no CI, onde o projeto inteiro é validado.
 *
 * Os globs não precisam excluir o que está no .prettierignore (pnpm-lock.yaml,
 * .next/, etc.): lint-staged só passa arquivos staged, e o prettier aplica o
 * ignore por conta própria.
 */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,jsonc,md,mdx,css,yml,yaml}': ['prettier --write'],
}
