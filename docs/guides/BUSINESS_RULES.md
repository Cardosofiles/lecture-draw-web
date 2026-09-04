# Regras de Negócio — lecture-draw-web

Sistema de sorteio de prêmios para evento de tecnologia. Usuários autenticados são participantes; admins conduzem o sorteio.

---

## 1. Autenticação e Acesso

| Regra     | Detalhe                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-01** | Login exclusivo via OAuth (Google ou GitHub). Sem cadastro manual.                                                                                                              |
| **BR-02** | Qualquer usuário não-admin que autentica é automaticamente registrado como participante (`RaffleEntry` criado).                                                                 |
| **BR-03** | Admins **não** são participantes do sorteio (`isParticipant` false, sem `RaffleEntry`).                                                                                         |
| **BR-04** | Rotas protegidas (`/dashboard`, `/raffle`, `/participants`, `/transfer`, `/sql-console`, `/config`) exigem sessão ativa. Sem sessão → redirect para `/login` com `callbackUrl`. |
| **BR-05** | `/sql-console` é exclusivo para admins. Usuário autenticado sem role `admin` → redirect para `/dashboard`.                                                                      |
| **BR-06** | Usuário autenticado que acessa `/login` → redirect para `/`.                                                                                                                    |

---

## 2. Participantes

| Regra     | Detalhe                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **BR-07** | Participante = usuário não-admin com `RaffleEntry`.                                                                              |
| **BR-08** | A listagem de participantes (`/participants`) exibe apenas não-admins com nome, email, avatar, data de entrada e prêmios ganhos. |
| **BR-09** | Contagem pública de participantes via `/api/participants/count` (sem autenticação).                                              |

---

## 3. Sorteio

| Regra     | Detalhe                                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-10** | **Somente admins** podem iniciar o sorteio.                                                                                                  |
| **BR-11** | O sorteio requer **mínimo de 5 participantes** elegíveis com `RaffleEntry`.                                                                  |
| **BR-12** | São sorteados exatamente **5 ganhadores**, um por prêmio (`RafflePrize` de número 1 a 5).                                                    |
| **BR-13** | A seleção é aleatória via **Fisher-Yates shuffle** sobre todos os `RaffleEntry` de não-admins.                                               |
| **BR-14** | Ao sortear: `winnerId` é preenchido em cada `RafflePrize`, `drawnAt` é atualizado no prêmio e o `RaffleEvent` ativo é marcado como sorteado. |
| **BR-15** | A página `/raffle` exibe cards dos ganhadores **progressivamente** conforme o sorteio acontece. O card do usuário logado é destacado.        |
| **BR-16** | O sorteio é **uma operação única por evento**. Não há mecanismo de re-sorteio parcial.                                                       |

---

## 4. Transferência de Prêmio

| Regra     | Detalhe                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| **BR-17** | Apenas o **ganhador original** do prêmio pode transferi-lo (`winnerId === usuário logado`).                           |
| **BR-18** | O destinatário deve ser um participante ativo (`isParticipant === true`).                                             |
| **BR-19** | **Auto-transferência é proibida** (não pode transferir para si mesmo).                                                |
| **BR-20** | A transferência preenche `transferredToId` no `RafflePrize`. O `winnerId` original é mantido como registro histórico. |
| **BR-21** | A página `/transfer` só é útil para ganhadores. Participantes sem prêmio não têm ação disponível.                     |

---

## 5. Exclusão de Conta

| Regra     | Detalhe                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-22** | Qualquer participante pode **excluir sua conta completamente** após o encerramento dos sorteios.                                                                                                      |
| **BR-23** | Ao excluir: `winnerId` de todos os prêmios ganhos é setado para `null` (prêmio volta ao pool), `transferredToId` é limpo, e o `User` é deletado em cascata (Session, Account, RaffleEntry, QueryLog). |
| **BR-24** | Prêmios cujo ganhador foi excluído ficam disponíveis para re-sorteio futuro (se houver novo evento).                                                                                                  |

---

## 6. Console SQL (Admin)

| Regra     | Detalhe                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------ |
| **BR-25** | Apenas admins têm acesso ao `/sql-console`.                                                            |
| **BR-26** | Somente **queries de leitura** são permitidas: `SELECT` e `WITH`.                                      |
| **BR-27** | São bloqueados: `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, `ALTER ... DROP`.                           |
| **BR-28** | Cada query executada é registrada em `QueryLog` com userId, SQL, duração, rowCount e erro (se houver). |
| **BR-29** | O admin pode visualizar o histórico de queries e navegar pelo schema do banco via schema browser.      |

---

## 7. Fluxo Completo da Aplicação

```
[Usuário acessa] → OAuth login → RaffleEntry criado automaticamente
        ↓
[Admin inicia sorteio] → Valida ≥5 participantes → Fisher-Yates shuffle
        ↓
5 ganhadores sorteados → Cards exibidos em /raffle progressivamente
        ↓
[Ganhador não quer o prêmio?] → Transfere para outro participante em /transfer
        ↓
[Após encerramento] → Participante pode excluir conta em /config
        ↓
Prêmios de contas excluídas retornam ao pool (winnerId = null)
```

---

## 8. Inconsistências e Gaps — todos resolvidos

| ID         | Severidade | Status    | Correção aplicada                                                                               |
| ---------- | ---------- | --------- | ----------------------------------------------------------------------------------------------- |
| **GAP-01** | Alta       | Resolvido | `proxy.ts`: `http:localhost:3000` → `http://localhost:3000`                                     |
| **GAP-02** | Alta       | Resolvido | `proxy.ts`: `/config` adicionado a `protectedPaths`                                             |
| **GAP-03** | Média      | Resolvido | `transferPrize()`: bloqueia segunda transferência se `transferredToId` já preenchido            |
| **GAP-04** | Média      | Resolvido | `drawRaffle()`: verifica `activeEvent.drawnAt` antes de prosseguir — impede re-sorteio          |
| **GAP-05** | Baixa      | Resolvido | `/api/participants/count`: exige sessão válida; retorna 401 para não autenticados               |
| **GAP-06** | Baixa      | Resolvido | `TransferLog` adicionado ao schema Prisma; toda transferência é registrada em transação atômica |

> **Nota de deploy**: o schema Prisma foi alterado (novo modelo `TransferLog`). Execute antes de subir para produção:
>
> ```bash
> pnpm db:generate
> pnpm db:push
> ```
