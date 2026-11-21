# Continuidade para o próximo agente

SAFEVISION 3D usa a Clínica ÁUREA como demonstração acadêmica de inspeção de riscos pré-documentados. Use a importação da Versão C como base de regressão e consulte o PR de preparação #1 quando consolidar a proposta de plataforma. A arquitetura real é estática e usa Babylon.js. Os cinco casos são R01 circulação, R02 rota de saída, R03 acessibilidade, R04 janela e pilar e R05 tubulação e viga.

O código e os sete segmentos estão em `apps/viewer`. Sirva essa pasta como raiz por HTTP local e HTTPS em um dispositivo externo. Consulte [os comandos](INSTRUCOES_EXECUCAO.md), [a arquitetura](ARQUITETURA.md), [o inventário](INVENTARIO_VERSAO_C.md) e [as evidências de teste](RELATORIO_TESTES.md).

Preserve a geometria da clínica, os dois estados de cada risco, as fichas, os 270 colisores, as 24 portas, os caminhos relativos e o fluxo de entrada XR. Faça mudanças em branch separada. Inicie a V1 pela consolidação dos dois PRs e pela prévia estática com verificação de regressão. Defina o modelo de autorização e armazenamento antes de integrar Auth e upload. O teste físico continua pendente e precisa cobrir conforto, controles, painel e estabilidade no Quest 2.

O PR #3 reúne os históricos. Esta branch adiciona dashboard e migração testados localmente, mantendo a distribuição original. Para retomar, confira o plano e diretório da prévia conforme [VERCEL_DEPLOYMENT](VERCEL_DEPLOYMENT.md). Identifique o projeto Supabase dedicado e aplique a migração apenas nesse destino. A seguir, execute fluxos reais de sessão e RLS conforme [SUPABASE_SETUP](SUPABASE_SETUP.md). Ainda não há URL de prévia nem dados remotos configurados.

## Ponto de retomada de 21/11/2026

| Revisão | Branch e commits | Estado conferido |
|---|---|---|
| [PR #3 — fundação](https://github.com/pyedro027/safevision-platform/pull/3) | `integration/platform-v1-foundation`, `2249233` e `d92c93d` | Rascunho aberto para `main`. Cinco conflitos em documentação e regras Git foram resolvidos. |
| [PR #4 — dashboard e dados](https://github.com/pyedro027/safevision-platform/pull/4) | `feature/platform-v1-projects`, `e96b957` e `303240a` | Rascunho aberto para a branch do PR #3. Não integrado à main. |

[PR #1](https://github.com/pyedro027/safevision-platform/pull/1) e [PR #2](https://github.com/pyedro027/safevision-platform/pull/2) são as referências históricas da preparação e da Versão C.

- **Aplicação.** `apps/platform/` é o dashboard. Rode `node scripts/build-platform.mjs` e sirva `dist/`. `/clinica/` é uma cópia intacta do visualizador. `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` habilitam o serviço de contas em um ambiente configurado.
- **Integridade.** A Versão C tem 42 arquivos. Os sete segmentos recompõem 113.018.368 bytes, SHA-256 `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. `tests/integridade.py` confere os hashes e `tests/motor.mjs` cobre seis casos do motor.
- **Testes.** `docs/qa-integracao.json` registra a rodada em Chrome com GPU, navegação, uma porta pela API e cinco alternâncias PROB/CORR. `tests/platform_browser.py` verifica o dashboard com API simulada. `tests/rls.mjs` aplica a migração em PostgreSQL/PGlite e verifica isolamento, CRUD, histórico e acesso anônimo. Nenhum desses ensaios equivale a autenticação remota ou homologação Quest 2.
- **Vercel.** Último estado observado: equipe `pyedros-projects` acessível, sem projeto SAFEVISION identificado. Plano e disponibilidade de prévia gratuita aguardam confirmação. Nenhum deploy da V1 ou URL HTTPS foi gerado. A publicação anterior da candidata C é independente.
- **Supabase.** Último estado observado: conector autenticado, sem ambiente SAFEVISION dedicado. A organização identificada tinha dois projetos ativos. Confirme destino, região e capacidade gratuita antes de provisionar. `supabase/migrations/20261121194021_platform_foundation.sql` não foi aplicada remotamente.

Primeira ação da próxima execução: verificar as confirmações da Vercel e do Supabase e reconfirmar os destinos. Validar a prévia da fundação em HTTPS antes de usar o dashboard com contas reais. Verificar os sete segmentos no servidor e a reconstrução no navegador. Depois aplicar a migração somente ao ambiente Supabase de desenvolvimento autorizado, validar Auth e RLS com duas contas e testar o dashboard conectado. O headset continua a cargo da homologação física. Siga o [protocolo de relatório](../AGENTS.md) a cada entrega.

## Retomada após a primeira prévia HTTPS

O ponto de retomada acima é histórico. A [Vercel Preview](https://safevision-platform-4y8u5a0md-pyedros-projects.vercel.app/) está `READY` no projeto existente, commit `593e343`. Dashboard, visualizador, navegação, cinco riscos e sete binários foram verificados em HTTPS. O GLB recompôs o SHA-256 original. Veja [evidência do navegador](qa-vercel-preview.json) e [registro de implantação](VERCEL_DEPLOYMENT.md).

A primeira ação agora é obter a autorização explícita para a migração no projeto `safevision3d` (`qltabckpluhxnskxgofx`, `us-east-1`), cuja branch principal é produção, ou seguir com um ambiente local isolado. A inspeção encontrou zero tabelas públicas, zero políticas públicas e zero migrações. Depois da autorização, aplicar somente a migração versionada, validar Auth/RLS com duas contas e configurar as variáveis públicas e redirecionamentos para a prévia. Não alterar a produção Vercel, a `main` ou `apps/viewer/`.

## Missão 06 — migração aplicada

O ponto anterior é histórico. Em 21/11/2026 a migração inicial foi aplicada uma única vez no `safevision3d` autorizado. O histórico remoto é `20261121204325`. Esta branch ajusta o nome do arquivo ao registro remoto, com o SQL e o SHA-256 preservados. Antes de qualquer comando de migração, confira se o checkout contém `supabase/migrations/20261121204325_platform_foundation.sql`. Não reaplique a versão histórica `20261121194021`.

Foram confirmadas as três tabelas, oito políticas e três gatilhos. A API anônima foi negada nas três tabelas. A validação Auth com duas contas reais ainda está pendente. Primeira ação da próxima execução: confirmar o escopo para configurar Auth e Vercel Preview e obter duas contas de teste autorizadas. A prévia atual da V1 segue disponível com a Clínica ÁUREA e sem backend configurado. Veja [a auditoria e o plano de integração](RELATORIO_MIGRACAO_SUPABASE_06.md).
