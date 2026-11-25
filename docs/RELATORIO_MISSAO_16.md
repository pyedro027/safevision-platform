# SAFEVISION Platform V1 — Demonstration Edition

## A. Identificação

24 de novembro de 2026. Missão 16, repositório pyedro027/safevision-platform, branch feature/demonstration-edition-v1. Base b7af326cf7fd507ec48ab004f0f65630dc152701. O último commit de código e testes desta rodada é f4ac198. O HEAD de entrega, incluindo esta documentação, é a referência remota do PR. A edição local está disponível para revisão do titular. [PR #13](https://github.com/pyedro027/safevision-platform/pull/13).

## B. Atividades

A auditoria e a linha de base antecederam as alterações. A navegação principal passou a abrir o modelo no contexto da plataforma. O tour ganhou entrada, barra de comandos, foco, tela cheia, ficha vinculada e retorno por origem. O Studio reutiliza a cena preparada. Inspeções preservam a edição temporária durante a visita ao modelo. A apresentação acrescenta dez etapas e utiliza os módulos reais. O QA final incluiu os cinco casos, controles, relatório impresso, falhas de rede e retorno contextual.

## C. Arquivos

Novos módulos em apps/platform incluem exploration.js, presentation.js, viewer-controls.js, edition.css e viewer-interior.css. Foram ajustados platform.js, workspace.js, inspection.js, index.html e os módulos studio/studio.js e studio/clinic-session.js. O build deriva a entrada integrada e verifica cada cópia do inventário. scripts/servir-demonstracao.py oferece inicialização em loopback. vercel.json define a proteção da branch. Três regressões receberam seletores das entradas atuais e três arquivos novos cobrem roteamento, roteiro e evidências.

Os documentos da missão abrangem visualizador, rotas, guia, apresentação, integridade, desempenho, matriz de aceitação e roadmap. Os relatórios de continuidade e o README apontam à nova edição. O inventário original, a clínica, os documentos técnicos e as migrações são referências preservadas. [Arquivos do PR](https://github.com/pyedro027/safevision-platform/pull/13/files).

## D. GitHub

PR #13 aberto em rascunho para feature/accounts-projects-v2. O PR #12 é a base anterior. A consulta retornou draft=true, merged=false e mergeable=true. Commits funcionais bac0ae6, 96ce46d e f4ac198. A lista completa, com o commit documental da entrega, está no histórico do PR. A revisão do proprietário precede qualquer integração. [Commits](https://github.com/pyedro027/safevision-platform/pull/13/commits).

## E. Vercel

Projeto safevision-platform, equipe pyedros-projects. Produção READY no deployment dpl_36t2LjWc8yGfNAjngMS5Gy8RC44r e commit 9624453. A consulta posterior ao push devolveu zero deployments para feature/demonstration-edition-v1. A proteção está na configuração Git do projeto. A versão desta missão é acessada em loopback.

## F. Supabase

safevision3d, us-east-1, ACTIVE_HEALTHY. A consulta de metadados confirmou RLS ativa em profiles, projects e project_versions e apenas a migração 20261121204325_platform_foundation. O SDK foi exercitado com autenticação simulada. Os testes SQL aconteceram em PGlite. As operações remotas da missão foram de leitura de metadados. Missão 14B desligada. O aviso anterior de proteção contra senhas vazadas continua como pendência administrativa do titular.

## G. Testes e qualidade

Nove suítes de regressão e duas novas suítes de navegador. O Studio conferiu dois PDFs, a reconstrução do GLB de 113.018.368 bytes e os dois estados dos cinco casos. O visualizador confirmou a lista de 21 ambientes e visitou A04 e a recepção, conferiu navegação e alternou dez estados. O retorno a R03 preservou o texto provisório. O Chrome gerou um PDF A4 de seis páginas. As 49 capturas possuem rastreabilidade no manifesto. [QA](QA_MISSAO_16.md) · [Evidências](evidencias-missao-16/manifesto.json).

## H. Problemas e pendências

Foram corrigidos o painel de pausa sobre a entrada, o transbordamento de marcadores em tela estreita e a falta de conferência da cópia do build. O headset físico, a stack Docker completa do Supabase, o fluxo remoto de e-mail e a taxa de quadros no dispositivo não foram validados nesta rodada. O tamanho do modelo justifica preparar o Studio antes de uma apresentação ao vivo. A validação visual no monitor do titular está pendente.

## I. Estado atual

O tour utiliza arquitetura, segmentos, controles, riscos e variantes preexistentes. As observações e o relatório derivam da avaliação humana. A carteira pode usar o backend configurado pelo titular. O Studio reconhece os PDFs oficiais e prepara a clínica existente. Conversão generalizada de projetos externos, inspeção automática e colaboração multiusuário permanecem no roadmap.

### SAFEVISION DEMONSTRATION READINESS

| Dimensão | Leitura para decisão |
|---|---|
| Identidade visual | Entrada, painel técnico e roteiro compartilham a identidade da plataforma. O comparativo R05 mostra o resultado dentro da cena. |
| Tour e modelagem | Canvas real, 42 arquivos idênticos ao inventário, sete segmentos e controles originais. |
| Navegação | Acesso ao 3D a partir da plataforma e retorno ao contexto de origem testados. |
| Funcionalidades | Studio, avaliação e relatório exercitados com recursos locais. Conta e carteira cobertas por regressão com API controlada. |
| Confiabilidade | Falha, retentativa, descarte e reutilização exercitados. Compatibilidade física em aberto. |
| Apresentação | Roteiro de dez etapas, retorno e reinício disponíveis. Há roteiro curto e roteiro estendido. |
| Transparência | Cinco casos documentados e propostas conceituais identificados como tais. |
| Segurança | RLS verificada, branch protegida e sessão demonstrativa separada da carteira. |
| Prontidão geral | A edição pode seguir para avaliação demonstrativa local pelo proprietário. Publicação e homologação comercial são decisões posteriores. |

## J. Próximas etapas

O titular pode percorrer o roteiro, conferir a legibilidade no projetor e revisar um caso da ficha até o PDF. Ajustes posteriores devem partir de observações reproduzíveis. Publicação, merge, sincronização remota e homologação no headset exigem decisão própria. [Guia](GUIA_APRESENTACAO_SAFE_V1.md) · [Roadmap](ROADMAP_POS_DEMONSTRACAO.md).

## K. Continuidade

Retome pela branch do PR #13. Confira git status, o HEAD remoto e a configuração pública local antes de reconstruir dist. Use python scripts/servir-demonstracao.py e abra #apresentacao. O fluxo curto pode seguir por #explorar/R05?de=apresentacao, #inspecoes/R05 e #relatorios. Consulte os resultados e o manifesto antes de repetir testes. Preserve apps/viewer, o inventário e supabase/migrations. [Rotas](ROTAS_E_NAVEGACAO_V1.md) · [Procedimento de QA](QA_MISSAO_16.md).
