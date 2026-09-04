/**
 * Tradução dos códigos de erro que o Better Auth devolve em `?error=` para
 * mensagens que o participante entende.
 *
 * O provedor social redireciona de volta para `/login?error=<code>` — a lista
 * abaixo cobre os códigos que aparecem no fluxo OAuth deste projeto; qualquer
 * outro cai no default, que ainda mostra o código para dar o que reportar ao
 * suporte durante o evento.
 */
export function getFriendlyErrorMessage(code: string | null): string | null {
  if (!code) return null
  switch (code) {
    case 'state_mismatch':
      return 'A validação da sessão OAuth falhou (state mismatch). Certifique-se de acessar via http://localhost:3000 e tente novamente.'
    case 'access_denied':
      return 'Login cancelado no provedor social.'
    case 'invalid_callback_request':
    case 'invalid_code':
    case 'no_code':
      return 'Código de autorização inválido ou expirado. Tente novamente.'
    case 'email_not_found':
      return 'E-mail não fornecido pelo provedor social. Verifique a visibilidade do e-mail na sua conta.'
    case 'account_already_linked_to_different_user':
      return 'Esta conta social já está vinculada a outro participante.'
    default:
      return `Falha na autenticação: ${code}`
  }
}
