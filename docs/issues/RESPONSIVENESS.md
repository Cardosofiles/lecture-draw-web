Auditei 7 páginas × 8 viewports (320/360/390/430/768/1024/1280/1440), 58 capturas. scripts/mint-session.ts foi removido. O dev server que subi segue rodando em background (task bm2vqqh1c).

Crítico

1. StatusBar corta conteúdo e é inalcançável — todas as páginas, todo celular
   .vscode-editor é overflow: hidden (src/app/globals.css:171) e a StatusBar (:179) tem largura intrínseca de 463px com gap:16px e itens nowrap, sem nenhum tratamento em media query. A 360px o grupo direito ocupa [193..463] — "2 participantes", relógio, UTF-8, TypeScript ficam cortados. scrollLeft move para 103 programaticamente, mas com overflow:hidden o usuário não tem como rolar. Some abaixo de 463px em /dashboard, /raffle, /participants, /transfer, /sql-console, /config.

2. TabBar desktop nunca é escondida no mobile
   O bloco @media (max-width: 768px) (:588) esconde .vscode-activity-bar e .vscode-sidebar, mas esquece .vscode-tab-bar (:190). Com .vscode-tab { min-width: 120px } (:205) × 5 abas = 604px (624 no sql-console) dentro de 320px. Duplica a MobileNav, consome 36px de altura e as abas têm 29px de altura.

Alto

3. /participants — tabela não reflui. A 390px o nome vira joa…/car…, a coluna de email fica com ~0px (div 32->151, 33->122 clipados) e os cabeçalhos colidem: "PARTICIPANTEEMAIL", "INSCRITO EMSTATUS". A 430px: div 10->224 — 10px visíveis de 224px.

4. /sql-console — SQL ilegível. O span da query tem 640px intrínsecos, clipado para 13px a 360, 49px a 390, 89px a 430, 427px a 768. Só funciona a partir de 1280.

5. Countdown do /dashboard com scroll horizontal. A linha dias/horas/min/seg exige 542px num overflow-x:auto — o elemento herói fica cortado em todo celular (20 : 20 : 23 com o terceiro número fora da tela).

Médio

6. Alvos de toque abaixo de 44px (Apple HIG) / 48px (Material): abas 29px, botão TERMINAL 27px, busca de participantes 34px, sidebar-item 30px, botão Account 28px, LECTURE-DRAW-WEB 25px.

7. Texto abaixo de 12px: 10px nos rótulos do countdown e da MobileNav (Início, Sorteio); 11px em badges, cabeçalhos de tabela, StatusBar e tempos do SQL.

8. #search-participants com font-size: 13px → Safari iOS dá zoom automático no foco. Precisa de ≥16px.

Sem problemas

/login está limpo nas 8 larguras — sem overflow, sem alvo pequeno, sem texto miúdo. O breakpoint 768/769 posiciona ActivityBar+Sidebar corretamente a partir de 1024.
