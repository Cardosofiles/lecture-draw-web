import Link from 'next/link'

import {
  COLLECTED_TABLES,
  NOT_COLLECTED,
  THIRD_PARTIES,
} from '@/modules/legal/data/data-collection'
import { DataTableCard } from '@/modules/legal/ui/components/data-table-card'
import {
  LegalCallout,
  LegalList,
  LegalParagraph,
  LegalSection,
} from '@/modules/legal/ui/components/legal-section'

/**
 * A data que o participante vê como "última atualização". É constante literal,
 * e não `new Date()`, porque um documento legal que se atualiza sozinho a cada
 * render não diz nada — a data só tem valor se for mexida junto com o texto.
 */
export const LAST_UPDATED = '4 de setembro de 2026'

const TOC = [
  { id: 'resumo', label: 'Resumo em 30 segundos' },
  { id: 'controlador', label: 'Quem é responsável' },
  { id: 'coleta', label: 'O que é coletado, tabela por tabela' },
  { id: 'nao-coletamos', label: 'O que não é feito' },
  { id: 'terceiros', label: 'Quem mais vê seus dados' },
  { id: 'visibilidade', label: 'O que os outros participantes veem' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'direitos', label: 'Seus direitos e como exercê-los' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'termos', label: 'Termos de Uso' },
  { id: 'sorteio', label: 'Regras do sorteio' },
  { id: 'transferencia', label: 'Transferência de prêmios' },
  { id: 'conduta', label: 'Conduta e suspensão' },
  { id: 'contato', label: 'Contato' },
]

/**
 * Política de Privacidade + Termos de Uso.
 *
 * É um Server Component sem `use client` de propósito: o documento é estático,
 * e não faz sentido cobrar JavaScript de quem só quer ler o que é guardado
 * sobre ele. O único movimento é o `scroll-smooth` já aplicado no `<html>`.
 */
export function PrivacyView() {
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 20px 0' }}>
      <header style={{ marginBottom: '40px' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--vscode-accent)',
            marginBottom: '12px',
          }}
        >
          Documento público
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 6vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--vscode-text)',
            marginBottom: '16px',
          }}
        >
          Política de Privacidade e{' '}
          <span className="text-glow" style={{ color: 'var(--vscode-accent)' }}>
            Termos de Uso
          </span>
        </h1>
        <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--vscode-text-muted)' }}>
          Este documento descreve, sem eufemismo, cada dado que o sistema de sorteio da palestra
          grava sobre você, por que ele é gravado, quem consegue vê-lo e como apagá-lo. A lista de
          campos abaixo espelha o schema real do banco de dados.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--vscode-text-mute)',
            marginTop: '16px',
          }}
        >
          Última atualização: {LAST_UPDATED}
        </p>
      </header>

      {/* Índice */}
      <nav
        aria-label="Índice do documento"
        style={{
          border: '1px solid var(--vscode-border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '48px',
          background: 'rgba(6, 11, 22, 0.5)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--vscode-text-mute)',
            marginBottom: '12px',
          }}
        >
          Neste documento
        </p>
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2px 20px',
          }}
        >
          {TOC.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '44px',
                  fontSize: '14px',
                  color: 'var(--vscode-text-muted)',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--vscode-accent)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <LegalSection id="resumo" index="01" title="Resumo em 30 segundos">
        <LegalCallout tone="accent" title="O essencial">
          <LegalList
            items={[
              <>
                O login é <strong>só</strong> via Google ou GitHub. Não existe senha neste sistema —
                nem para criar, nem para guardar.
              </>,
              <>
                Do provedor vêm quatro coisas: <strong>nome, e-mail, foto de perfil</strong> e um
                identificador. Nada além disso.
              </>,
              <>
                Entrar já inscreve você no sorteio automaticamente. Isso é o produto, não um efeito
                colateral.
              </>,
              <>
                O sistema também registra <strong>IP e navegador</strong> da sua sessão — o Better
                Auth faz isso para conseguir invalidar acessos.
              </>,
              <>
                Não há analytics, rastreador, anúncio ou venda de dados. Nenhum e-mail é disparado
                para você.
              </>,
              <>
                Você apaga tudo sozinho, a qualquer momento, em <strong>Configurações</strong> — sem
                pedir autorização a ninguém.
              </>,
            ]}
          />
        </LegalCallout>
      </LegalSection>

      <LegalSection id="controlador" index="02" title="Quem é responsável">
        <LegalParagraph>
          Este site é um projeto acadêmico e demonstrativo, criado para a palestra sobre{' '}
          <em>Spec-Driven Development</em> com Inteligência Artificial realizada na Unitri
          (Uberlândia/MG), cuja finalidade é sortear 5 configurações completas de computador entre
          os presentes.
        </LegalParagraph>
        <LegalParagraph>
          O controlador dos dados, na acepção da{' '}
          <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>, é o autor e
          organizador do projeto, <strong>João Batista Cardoso Miranda</strong>. Os canais de
          contato estão na{' '}
          <Link href="/creditos" style={linkStyle}>
            página de créditos
          </Link>
          .
        </LegalParagraph>
        <LegalParagraph>
          A base legal para o tratamento é o <strong>consentimento</strong> (art. 7º, I), dado no
          momento em que você escolhe entrar com Google ou GitHub, somado ao{' '}
          <strong>legítimo interesse</strong> (art. 7º, IX) na parcela estritamente necessária para
          manter a sessão segura e a lisura do sorteio.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="coleta" index="03" title="O que é coletado, tabela por tabela">
        <LegalParagraph>
          Abaixo está o inventário completo do banco de dados PostgreSQL, na mesma nomenclatura do
          schema versionado no repositório. Se um campo guarda algo sobre você, ele está nesta
          lista.
        </LegalParagraph>
        <LegalCallout tone="orange" title="Leitura dos rótulos">
          Campos em <span style={{ color: 'var(--vscode-orange)' }}>laranja</span> são os que
          merecem sua atenção: identificam você diretamente ou permitem acessar sua conta. As
          etiquetas dizem se o valor veio do provedor OAuth, se foi gerado pelo sistema ou se nasceu
          do seu uso.
        </LegalCallout>

        <div style={{ marginTop: '24px' }}>
          {COLLECTED_TABLES.map((table) => (
            <DataTableCard key={table.table} table={table} />
          ))}
        </div>

        <LegalParagraph>
          Além do banco, duas estruturas vivem apenas na memória do servidor e{' '}
          <strong>não são persistidas</strong>: o contador de <em>rate limit</em>, com chave
          derivada do IP, que impede que a rede do evento derrube o login; e um cache de 2 segundos
          dos resultados do sorteio, que evita centenas de consultas simultâneas ao banco. As duas
          desaparecem quando o processo reinicia.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="nao-coletamos" index="04" title="O que não é feito">
        <LegalParagraph>
          Tão importante quanto declarar o que existe é declarar o que não existe. Neste sistema:
        </LegalParagraph>
        <LegalList items={NOT_COLLECTED.map((item) => item)} />
      </LegalSection>

      <LegalSection id="terceiros" index="05" title="Quem mais vê seus dados">
        <LegalParagraph>
          Nenhum dado é compartilhado com parceiros comerciais. Os terceiros abaixo participam
          porque a aplicação tecnicamente não roda sem eles:
        </LegalParagraph>
        {THIRD_PARTIES.map((party) => (
          <div
            key={party.name}
            style={{
              borderLeft: '2px solid var(--vscode-border)',
              paddingLeft: '16px',
              marginBottom: '18px',
            }}
          >
            <p style={{ color: 'var(--vscode-text)', fontWeight: 600, fontSize: '15px' }}>
              {party.name}
              <span
                style={{
                  marginLeft: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 400,
                  color: 'var(--vscode-text-mute)',
                }}
              >
                {party.role}
              </span>
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.65 }}>{party.detail}</p>
          </div>
        ))}
      </LegalSection>

      <LegalSection id="visibilidade" index="06" title="O que os outros participantes veem">
        <LegalParagraph>
          O sorteio é público entre os presentes — é o que o torna auditável. Concretamente, quem
          está logado consegue ver:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              Na tela <strong>Participantes</strong>: seu nome, sua foto e seu e-mail{' '}
              <strong>parcialmente mascarado</strong> (apenas os três primeiros caracteres e o
              domínio, ex.: <code style={codeStyle}>joa****@gmail.com</code>).
            </>,
            <>
              Na tela <strong>Transferir</strong>: seu nome e seu <strong>e-mail completo</strong>.
              Essa tela existe para que um ganhador consiga identificar sem ambiguidade a pessoa
              certa antes de repassar um prêmio — dois participantes homônimos são distinguidos pelo
              e-mail.
            </>,
            <>
              Na tela de <strong>resultados</strong>: se você for sorteado, seu nome e sua foto
              aparecem como ganhador, inclusive projetados no telão do evento.
            </>,
          ]}
        />
        <LegalCallout tone="magenta" title="Se isso for um problema para você">
          Não há como participar do sorteio de forma anônima: o nome precisa ser exibido para que a
          entrega do prêmio seja verificável na hora. Se preferir não expor esses dados, exclua a
          conta — a exclusão remove você da lista e do sorteio imediatamente.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="cookies" index="07" title="Cookies">
        <LegalParagraph>
          Existe <strong>um único cookie</strong>, emitido pelo Better Auth:{' '}
          <code style={codeStyle}>better-auth.session_token</code> (em produção, servido como{' '}
          <code style={codeStyle}>__Secure-better-auth.session_token</code>). Ele guarda o
          identificador assinado da sua sessão e é <strong>estritamente necessário</strong>: sem
          ele, cada clique exigiria um login novo.
        </LegalParagraph>
        <LegalParagraph>
          Não há cookies de análise, de publicidade ou de terceiros — motivo pelo qual este site não
          exibe banner de consentimento de cookies. Ao sair, o cookie é invalidado no servidor e
          removido do navegador.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="direitos" index="08" title="Seus direitos e como exercê-los">
        <LegalParagraph>
          A LGPD garante a você acesso, correção, portabilidade, revogação do consentimento e
          eliminação dos dados. Neste sistema, o mais importante deles é automático:
        </LegalParagraph>
        <LegalCallout tone="green" title="Exclusão imediata, sem intermediário">
          <LegalParagraph>
            Em <strong>Configurações → Zona de exclusão</strong>, o botão de excluir conta executa,
            em uma única transação no banco:
          </LegalParagraph>
          <LegalList
            items={[
              'Prêmios que você ganhou voltam ao estado de não sorteados e retornam ao evento.',
              'Prêmios recebidos por transferência são desvinculados de você.',
              'Seus registros de transferência e de auditoria de consultas são apagados.',
              'Seu cadastro é apagado, levando junto sessões, vínculos OAuth e sua inscrição no sorteio.',
            ]}
          />
          <p style={{ marginTop: '10px' }}>
            Não há <em>soft delete</em>, cópia sombra ou período de carência: a linha deixa de
            existir. Como consequência, uma conta excluída deixa de concorrer — se a exclusão for
            feita antes do sorteio, você fica de fora dele.
          </p>
        </LegalCallout>
        <LegalParagraph>
          Para <strong>correção</strong> de nome, e-mail ou foto, altere o dado no Google ou no
          GitHub: como esses campos vêm de lá, o valor é atualizado na origem. Para acesso a uma
          cópia dos seus dados ou qualquer outra solicitação, use os canais na{' '}
          <Link href="/creditos" style={linkStyle}>
            página de créditos
          </Link>
          .
        </LegalParagraph>
        <LegalParagraph>
          Revogar o consentimento também é possível pelo lado do provedor, removendo a autorização
          do aplicativo nas configurações de segurança da sua conta Google ou GitHub.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="seguranca" index="09" title="Segurança">
        <LegalParagraph>
          As medidas técnicas em vigor: tráfego exclusivamente por HTTPS; cookie de sessão assinado
          e marcado como <code style={codeStyle}>Secure</code> em produção; segredos e credenciais
          fora do repositório, validados na inicialização; rotas administrativas verificadas no
          servidor a cada requisição, e não apenas escondidas na interface; e limite de requisições
          por origem contra tentativas de abuso.
        </LegalParagraph>
        <LegalParagraph>
          Ainda assim, seja realista sobre o que isto é: um projeto acadêmico construído para uma
          palestra, mantido por uma pessoa. Nenhum sistema é inviolável, e você não deve tratar esta
          plataforma como cofre de dado sensível. O que ela guarda sobre você é o que está descrito
          na seção 03 — nada além disso.
        </LegalParagraph>
      </LegalSection>

      {/* ─── Termos de Uso ───────────────────────────────────────────── */}
      <div
        style={{
          margin: '64px 0 40px',
          padding: '28px 24px',
          border: '1px solid var(--vscode-accent-dim)',
          borderRadius: '12px',
          background: 'var(--vscode-accent-ghost)',
        }}
      >
        <h2
          id="termos"
          style={{
            scrollMarginTop: '80px',
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--vscode-text)',
            marginBottom: '8px',
          }}
        >
          Termos de Uso
        </h2>
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--vscode-text-muted)' }}>
          As regras a seguir valem para todo mundo que entra na plataforma e são as mesmas que o
          código aplica — elas não dependem da boa vontade de quem opera o sistema.
        </p>
      </div>

      <LegalSection id="sorteio" index="10" title="Regras do sorteio">
        <LegalList
          items={[
            <>
              <strong>Elegibilidade.</strong> Qualquer pessoa que faça login com Google ou GitHub é
              inscrita automaticamente e concorre. Uma conta por pessoa: o e-mail é chave única.
            </>,
            <>
              <strong>O organizador não concorre.</strong> A conta de administrador é marcada como
              não participante e nunca recebe inscrição no sorteio.
            </>,
            <>
              <strong>Quórum mínimo.</strong> O sorteio só pode ser executado com pelo menos{' '}
              <strong>5 participantes elegíveis</strong> inscritos.
            </>,
            <>
              <strong>Aleatoriedade.</strong> A seleção usa o algoritmo{' '}
              <em>Fisher-Yates shuffle</em>, que dá a cada inscrito exatamente a mesma probabilidade
              de ser sorteado. Não há peso, prioridade ou ordem de chegada.
            </>,
            <>
              <strong>Uma única vez.</strong> O sorteio de um evento é executado dentro de uma
              transação atômica que marca o evento como sorteado. Uma segunda tentativa é recusada
              pelo banco — não existe &ldquo;sortear de novo&rdquo; nem desfazer.
            </>,
            <>
              <strong>Só o administrador dispara.</strong> A execução exige papel de administrador,
              verificado no servidor.
            </>,
            <>
              <strong>Prêmios.</strong> São 5 configurações completas de computador, numeradas, cada
              uma com um ganhador. A entrega física, prazos e condições são combinados
              presencialmente no evento e não fazem parte desta plataforma.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="transferencia" index="11" title="Transferência de prêmios">
        <LegalParagraph>
          Ganhou e quer passar adiante? Pode — dentro destas regras, todas aplicadas pelo servidor:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              Apenas o <strong>ganhador original</strong> transfere o próprio prêmio. Ninguém
              transfere prêmio alheio.
            </>,
            <>
              A transferência é <strong>única e definitiva</strong>: um prêmio já transferido não
              pode ser transferido outra vez, nem revertido pela plataforma.
            </>,
            <>
              O destinatário precisa ser um <strong>participante ativo</strong>, não administrador e
              diferente de você — autotransferência é recusada.
            </>,
            <>
              Toda transferência gera um <strong>registro permanente</strong> (quem passou, para
              quem, quando), para que a titularidade do prêmio seja incontestável no momento da
              entrega.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="conduta" index="12" title="Conduta e suspensão">
        <LegalParagraph>Ao usar a plataforma, você concorda em não:</LegalParagraph>
        <LegalList
          items={[
            'Criar mais de uma conta para aumentar suas chances no sorteio.',
            'Automatizar requisições, testar limites de carga ou tentar contornar o controle de acesso.',
            'Tentar acessar rotas administrativas, dados de outros participantes ou o console SQL sem a devida permissão.',
            'Fazer engenharia reversa da plataforma com o objetivo de influenciar o resultado do sorteio.',
          ]}
        />
        <LegalParagraph>
          O console SQL é exclusivo do administrador, restrito a consultas de leitura (
          <code style={codeStyle}>SELECT</code> e <code style={codeStyle}>WITH</code>), com comandos
          destrutivos bloqueados, e toda consulta executada fica registrada e auditável.
        </LegalParagraph>
        <LegalCallout tone="orange" title="Consequência">
          Contas que violarem estas regras podem ser desclassificadas do sorteio e removidas, a
          critério do organizador, inclusive durante o evento.
        </LegalCallout>
        <LegalParagraph>
          A plataforma é fornecida <strong>&ldquo;como está&rdquo;</strong>, sem garantia de
          disponibilidade ininterrupta. Trata-se de um sistema construído para um evento único, e
          pode sair do ar depois dele. Alterações nestes termos serão publicadas nesta mesma página,
          com a data de atualização revisada no topo.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contato" index="13" title="Contato">
        <LegalParagraph>
          Dúvidas sobre este documento, pedidos relacionados aos seus dados ou qualquer questão
          sobre o sorteio: fale diretamente com o autor pelos canais listados na{' '}
          <Link href="/creditos" style={linkStyle}>
            página de créditos
          </Link>
          . Como o projeto é mantido por uma pessoa só, a resposta vem dela — não de um formulário.
        </LegalParagraph>
      </LegalSection>
    </div>
  )
}

const linkStyle: React.CSSProperties = {
  color: 'var(--vscode-accent)',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
}

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: 'var(--vscode-accent)',
  background: 'rgba(0, 229, 255, 0.08)',
  borderRadius: '4px',
  padding: '1px 6px',
}
