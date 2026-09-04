/**
 * Inventário do que a aplicação realmente grava, tabela por tabela.
 *
 * Este arquivo é o espelho declarado de `prisma/schema.prisma`. A política de
 * privacidade é renderizada a partir daqui — e não de um texto solto — para que
 * uma mudança no schema tenha um lugar óbvio para ser refletida no que o
 * participante lê. Se você adicionar uma coluna que guarda dado pessoal e não
 * atualizar esta lista, a página passa a mentir.
 *
 * Regra de honestidade: descreva o que a coluna *guarda*, não o que ela
 * *deveria* guardar. Tokens de OAuth, IP e user-agent estão aqui porque o
 * Better Auth os persiste de fato.
 */

/** De onde o valor vem — o participante tem direito de saber a procedência. */
export type FieldOrigin =
  /** Veio do provedor OAuth (Google/GitHub) no momento do login. */
  | 'oauth'
  /** Gerado pela aplicação (identificadores, carimbos de tempo, flags). */
  | 'gerado'
  /** Derivado do uso: requisição HTTP, ação do participante ou do admin. */
  | 'uso'

export interface CollectedField {
  name: string
  description: string
  origin: FieldOrigin
  /** Marca o que é dado pessoal sensível o bastante para merecer destaque visual. */
  sensitive?: boolean
}

export interface CollectedTable {
  /** Nome do model no Prisma — o mesmo que aparece no banco. */
  table: string
  /** Rótulo legível para quem não conhece o schema. */
  label: string
  purpose: string
  /** O que acontece com essas linhas quando a conta é excluída. */
  retention: string
  fields: CollectedField[]
}

export const ORIGIN_LABELS: Record<FieldOrigin, string> = {
  oauth: 'Provedor OAuth',
  gerado: 'Gerado pelo sistema',
  uso: 'Coletado no uso',
}

/**
 * As tabelas na ordem em que fazem sentido para o leitor: identidade primeiro,
 * credenciais depois, e por último os registros de atividade.
 */
export const COLLECTED_TABLES: CollectedTable[] = [
  {
    table: 'User',
    label: 'Seu cadastro',
    purpose:
      'Identificar você na plataforma, exibir seu nome e foto na lista de participantes e saber se você concorre ao sorteio.',
    retention: 'Apagado imediatamente quando você exclui a conta em Configurações.',
    fields: [
      {
        name: 'id',
        description: 'Identificador interno (cuid) gerado no cadastro.',
        origin: 'gerado',
      },
      {
        name: 'name',
        description: 'Seu nome público, exatamente como consta no Google ou no GitHub.',
        origin: 'oauth',
      },
      {
        name: 'email',
        description: 'O e-mail da conta usada no login. É a chave única do cadastro.',
        origin: 'oauth',
        sensitive: true,
      },
      {
        name: 'emailVerified',
        description: 'Se o provedor declarou o e-mail como verificado.',
        origin: 'oauth',
      },
      {
        name: 'image',
        description:
          'A URL da sua foto de perfil no provedor. A imagem em si não é copiada — é carregada direto do Google/GitHub.',
        origin: 'oauth',
      },
      {
        name: 'role',
        description: '"user" para todo mundo; "admin" apenas para o organizador do evento.',
        origin: 'gerado',
      },
      {
        name: 'isParticipant',
        description: 'Se você está elegível ao sorteio. Administradores não concorrem.',
        origin: 'gerado',
      },
      {
        name: 'createdAt / updatedAt',
        description: 'Data do primeiro login e da última alteração do cadastro.',
        origin: 'gerado',
      },
    ],
  },
  {
    table: 'Account',
    label: 'Vínculo com Google / GitHub',
    purpose:
      'Ligar seu cadastro à conta do provedor social, para que o próximo login reconheça você como a mesma pessoa.',
    retention: 'Apagado em cascata junto com a conta.',
    fields: [
      {
        name: 'accountId / providerId / issuer',
        description:
          'Seu identificador dentro do provedor e qual provedor foi usado (google ou github).',
        origin: 'oauth',
      },
      {
        name: 'accessToken / refreshToken / idToken',
        description:
          'Tokens devolvidos pelo provedor no fim do fluxo OAuth, gravados pelo Better Auth. Só são usados para validar a sessão — a aplicação não chama nenhuma API do Google ou do GitHub em seu nome.',
        origin: 'oauth',
        sensitive: true,
      },
      {
        name: 'scope',
        description:
          'As permissões concedidas — apenas perfil básico e e-mail. Nada de contatos, repositórios, arquivos ou publicações.',
        origin: 'oauth',
      },
      {
        name: 'password',
        description:
          'Existe na tabela por exigência do Better Auth, mas fica sempre nulo: não há cadastro por senha neste sistema.',
        origin: 'gerado',
      },
    ],
  },
  {
    table: 'Session',
    label: 'Sessões ativas',
    purpose:
      'Manter você logado entre uma página e outra e permitir encerrar o acesso quando você sai.',
    retention: 'Apagada em cascata com a conta; também expira sozinha na data de `expiresAt`.',
    fields: [
      {
        name: 'token',
        description: 'O identificador assinado guardado no cookie de sessão do seu navegador.',
        origin: 'gerado',
        sensitive: true,
      },
      {
        name: 'ipAddress',
        description:
          'O endereço IP da requisição de login. No dia do evento, quase todo mundo aparece com o mesmo IP — o da rede da Unitri.',
        origin: 'uso',
        sensitive: true,
      },
      {
        name: 'userAgent',
        description: 'A string de navegador/sistema enviada pelo seu dispositivo.',
        origin: 'uso',
        sensitive: true,
      },
      {
        name: 'expiresAt / createdAt / updatedAt',
        description: 'Quando a sessão nasceu e quando ela deixa de valer.',
        origin: 'gerado',
      },
    ],
  },
  {
    table: 'Verification',
    label: 'Estado temporário do OAuth',
    purpose:
      'Guardar por poucos minutos o estado do fluxo de login (proteção contra CSRF) enquanto você está na tela do Google ou do GitHub.',
    retention: 'Registros expiram e são descartados automaticamente; não formam histórico.',
    fields: [
      {
        name: 'identifier / value / expiresAt',
        description: 'Valores efêmeros do handshake OAuth. Não descrevem você nem seu uso do site.',
        origin: 'gerado',
      },
    ],
  },
  {
    table: 'RaffleEntry',
    label: 'Sua inscrição no sorteio',
    purpose:
      'Registrar que você está concorrendo. É criada automaticamente no seu primeiro login — é isso que significa "entrar já inscreve você".',
    retention: 'Apagada em cascata com a conta (e você deixa de concorrer).',
    fields: [
      { name: 'userId', description: 'Referência ao seu cadastro.', origin: 'gerado' },
      {
        name: 'createdAt',
        description: 'O instante em que você entrou no sorteio.',
        origin: 'gerado',
      },
    ],
  },
  {
    table: 'RafflePrize',
    label: 'Prêmios e ganhadores',
    purpose: 'Guardar qual configuração de PC saiu para quem, e para quem ela foi transferida.',
    retention:
      'A linha do prêmio permanece (ela é do evento, não sua), mas seu vínculo é anulado: ao excluir a conta, o prêmio volta ao estado de não sorteado.',
    fields: [
      {
        name: 'winnerId',
        description: 'Seu id, caso você seja sorteado. Fica público na tela de resultados.',
        origin: 'uso',
      },
      {
        name: 'transferredToId',
        description: 'O id de quem recebeu o prêmio, se houve transferência.',
        origin: 'uso',
      },
      { name: 'drawnAt', description: 'O instante do sorteio.', origin: 'gerado' },
    ],
  },
  {
    table: 'TransferLog',
    label: 'Histórico de transferências',
    purpose:
      'Deixar rastreável quem passou qual prêmio para quem — é a garantia de que uma transferência não pode ser contestada depois.',
    retention: 'Apagado explicitamente antes da exclusão da sua conta.',
    fields: [
      {
        name: 'prizeId / fromUserId / toUserId',
        description: 'Qual prêmio mudou de mãos, de quem para quem.',
        origin: 'uso',
      },
      { name: 'createdAt', description: 'O instante da transferência.', origin: 'gerado' },
    ],
  },
  {
    table: 'QueryLog',
    label: 'Auditoria do console SQL (somente admin)',
    purpose:
      'Registrar toda consulta executada no console administrativo. Existe para auditar o organizador, não os participantes.',
    retention: 'Apagado explicitamente antes da exclusão da conta que executou as consultas.',
    fields: [
      {
        name: 'userId / sql / duration / rowCount / error',
        description:
          'Quem executou, o texto exato da consulta, quanto tempo levou, quantas linhas voltaram e o erro, se houve. Apenas contas com papel de administrador geram linhas aqui.',
        origin: 'uso',
      },
    ],
  },
]

/** Terceiros que inevitavelmente veem algum dado seu, e o que cada um recebe. */
export const THIRD_PARTIES = [
  {
    name: 'Google e GitHub',
    role: 'Autenticação (OAuth)',
    detail:
      'Você se autentica no site deles, não no nosso. Eles nos devolvem nome, e-mail, foto e um identificador. Nós nunca vemos sua senha nem seu segundo fator.',
  },
  {
    name: 'Vercel',
    role: 'Hospedagem da aplicação',
    detail:
      'Processa as requisições HTTP e mantém logs operacionais de infraestrutura (incluindo endereço IP), conforme a política de privacidade da própria Vercel.',
  },
  {
    name: 'Neon',
    role: 'Banco de dados PostgreSQL',
    detail: 'Armazena, em servidor gerenciado, exatamente as tabelas descritas acima.',
  },
] as const

/** O que a aplicação deliberadamente NÃO faz — tão relevante quanto o que faz. */
export const NOT_COLLECTED = [
  'Nenhuma ferramenta de analytics, pixel de rastreamento, mapa de calor ou gravação de sessão.',
  'Nenhum cookie de publicidade ou de terceiros. O único cookie é o de sessão do Better Auth, sem o qual o login não funciona.',
  'Nenhum dado é vendido, alugado ou cedido para fins comerciais ou de marketing.',
  'Nenhum disparo de e-mail: não há newsletter, notificação por e-mail nem lista de contatos.',
  'Nenhuma senha é criada, pedida ou armazenada — o acesso é exclusivamente via Google ou GitHub.',
  'Nenhuma coleta de geolocalização, agenda, contatos, arquivos ou repositórios.',
]
