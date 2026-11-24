# SAFEVISION PLATFORM V1 — Relatório de continuidade para o ChatGPT
## Missão 15 · 24 de novembro de 2026

### A. Identificação
Desenvolvimento da Demonstration Edition em pyedro027/safevision-platform, branch feature/accounts-projects-v2, baseada no PR #11 em bf97064b2e488111d9066f2259f68a6a2f9bc5a1. Entrega local para revisão. Homologação hospedada e aprovação visual pendentes.

### B. Atividades
A base foi auditada antes das mudanças. O novo fluxo verifica a identidade restaurada, protege a recuperação, trata erros e mantém o retorno ao projeto pedido. A carteira tem grade, lista, busca, quatro ordenações, contagem, CRUD e histórico por projeto. Edições e exclusões verificam a revisão observada. A clínica e seus cinco riscos continuam separados do cadastro privado.

### C. Arquivos
apps/platform/index.html carrega o novo CSS. platform.js integra Auth, perfil, carteira, formulários, roteamento e limites de sessão. projects.js e projects.css apresentam carteira e detalhes. project-data.js centraliza as consultas sob identidade verificada. vercel.json exclui a branch de deploy automático. tests/platform_fixture.py compartilha o transporte simulado. tests/platform_browser.py, tests/accounts_projects_browser.py e tests/rls.mjs exercitam os fluxos. Os documentos específicos, QA e imagens ficam em docs. Os arquivos de apps/viewer e as migrações foram comparados à base.

### D. GitHub
Branch empilhada sobre feature/inspection-cloud-sync-v1. Commits de implementação acf5eac, 1c40881 e ef2a5ee. O commit e10bb17 registra documentação e evidências. O [PR #12 em rascunho](https://github.com/pyedro027/safevision-platform/pull/12) registra a HEAD da entrega e depende do #11. Os PRs #9, #10 e #11 estavam abertos e em rascunho na conferência inicial. A main não recebeu merge.

### E. Vercel
Produção observada em dpl_36t2LjWc8yGfNAjngMS5Gy8RC44r, commit 96244537. A consulta posterior ao push retornou zero deployments para a branch da missão. A tela de visitante foi aberta no navegador integrado sobre a distribuição local. O repositório desabilita a criação de deployment para a branch da Missão 15. Não houve operação de deploy, promoção, domínio ou variável hospedada nesta execução.

### F. Supabase
safevision3d, us-east-1. Catálogo lido no início e no fim. Três tabelas com RLS e apenas a migração platform_foundation de 20261121204325. O conteúdo consultado do catálogo coincidiu nas duas leituras. GET de configurações públicas confirmou Auth por e-mail com confirmação. A consulta anônima à raiz REST respondeu 401. Auditoria e chave publicável vieram de consultas de leitura. Nenhuma conta de teste, gravação de projeto, e-mail de recuperação ou alteração administrativa foi executada no hospedado.

### G. Qualidade
A suíte separa Chrome com respostas simuladas, SQL executado em PostgreSQL isolado e regressão do 3D real. Há 30 capturas de revisão e matriz individual de 54 critérios. O PDF de inspeção manteve seis páginas. Os 42 arquivos, sete segmentos e hash do GLB foram conferidos. [QA e reprodução](QA_MISSAO_15.md) · [Dados estruturados](qa-missao-15.json).

### H. Pendências
Sem executável Docker e sem serviço local disponível para uma stack Supabase completa. Falta confirmar Auth → JWT → PostgREST com duas identidades integradas, entrega e expiração real de e-mail e callback local autorizado. A verificação administrativa completa de schemas da Data API também permanece pendente. O tour direto ainda abre o shell legado. Medições de desempenho em escala comercial e homologação física no Quest 2 ficam para etapa específica.

### I. Estado das funcionalidades

| Funcionalidade | Situação na entrega |
| --- | --- |
| Login, cadastro, recuperação, sessão, logout e perfil | Implementados com SDK real e testes de transporte simulado. Aguardam homologação integral por ambiente autorizado. |
| Projetos privados, criação, edição, exclusão, detalhes e histórico | UI testada em Chrome com HTTP simulado. Regras de propriedade, CRUD e histórico exercitados também em PostgreSQL isolado. |
| Busca, contagem, grade, lista e ordenação | Implementadas na interface, testadas localmente com registros de fixture. |
| RLS | Testada no PostgreSQL isolado. Catálogo hospedado verificado em leitura. |
| Dashboard, Studio, registros de inspeção e relatório | Regressões executadas localmente. Relatório demonstrativo A4 e modelo ÁUREA disponíveis. |
| Modelo 3D | Distribuição original real conferida por hash e carregada com o Studio. |
| Sincronização hospedada de inspeções | Missão 14B suspensa. |
| Visualizador moderno e modo de apresentação | Planejados para M16. |
| Conversão universal, publicação comercial e upload de modelo externo | Fora desta entrega. |

### J. Próximos passos
Revisão do proprietário no servidor de loopback. Homologação de conta real conforme autorização e ambiente disponíveis. Na M16, unificar os pontos de acesso, preservar o contrato do iframe, integrar visualmente o tour, consolidar o roteiro, validar retornos e repetir as regressões.

### K. Como retomar
Use a HEAD da branch feature/accounts-projects-v2. Abra http://127.0.0.1:4181/#conta e #projetos. A rota de detalhe é #projetos/<UUID>. Consulte [contas](CONTAS_E_AUTENTICACAO_V1.md), [carteira e roteiro do proprietário](MEUS_PROJETOS_V2.md), [segurança](SEGURANCA_CONTAS_PROJETOS_M15.md), [revisão visual e comandos](QA_MISSAO_15.md) e [contrato do visualizador](PREPARACAO_VISUALIZADOR_M16.md). Preserve viewer, V03, R01–R05, migrações, PRs empilhados e produção. Não iniciar M16 ou Marco 14B por efeito desta entrega.

## Operações pendentes de autorização do proprietário

| Operação | Ambiente e impacto | Alternativa, verificação e recuperação |
| --- | --- | --- |
| Homologar duas contas no serviço hospedado | Auth e registros de teste reais. Exige identidades autorizadas e acordo sobre o destino dos registros. | Executar stack local quando disponível. Validar A/B, reapertura, histórico e RLS. Limpeza apenas dos registros de teste com autorização específica. |
| Adicionar callback de loopback, se necessário | Alteração administrativa da allowlist para e-mail. Um destino incorreto interfere no retorno. | Usar a prévia já autorizada ou serviço local de e-mail. Conferir o retorno exato e remover apenas a URL adicionada se a mudança for revertida. |
| Habilitar proteção de senhas vazadas | Recurso administrativo do Auth que pode afetar cadastros e trocas de senha. | Verificar suporte do plano e testar em ambiente autorizado. Registrar a configuração anterior antes de uma mudança aprovada. |
| Ativar a migração e sincronização de inspeções | Marco 14B separado, impacto em esquema e política hospedados. | Manter rascunhos locais e seguir o plano da Missão 14, com backup verificado, validação isolada e verificação posterior independente. |
