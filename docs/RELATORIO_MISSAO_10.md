# Missão 10 — Homologação da prévia e diagnóstico do domínio público

Data: 21/11/2026. Resultado: **homologação parcial**. A regressão do dashboard e da Clínica ÁUREA passou na prévia HTTPS. As fases que exigem interação do titular ou duas contas seguem pendentes. O proprietário informou que deseja acesso público e que ainda não dispõe de uma segunda caixa de teste.

## Acesso e ambientes

| Ambiente | Resultado observado |
|---|---|
| [Prévia canônica](https://safevision-platform-2bzty7au8-pyedros-projects.vercel.app/) | Deploy `dpl_Aq1pu45FoBBxKpAzLXvqZ71TqFza`, `READY`, commit `6a2a92608732430667e1eb7ae29ba34336c6cdf0`. Sem sessão Vercel, o acesso à raiz retornou HTTP 302. Com acesso Vercel, o Chrome abriu a aplicação e o visualizador. |
| [Domínio público de produção](https://safevision-platform.vercel.app/) | Domínio verificado no projeto `safevision-platform`, equipe `pyedros-projects`. Aponta para `dpl_36t2LjWc8yGfNAjngMS5Gy8RC44r`, commit `96244537eff43e4213201104ced1694a290deaa2`. As requisições sem sessão à raiz, a `/config.json` e a `/clinica/` retornaram HTTP 404. |

A árvore Git do commit atualmente em produção contém apenas `README.md`. A Missão 10 preservou a produção e a proteção da prévia. O pedido de acesso público foi registrado para uma etapa de publicação separada. Se autorizada, validar a aplicação em produção com a configuração pública do Supabase, revisar os retornos de Auth do domínio escolhido e testar o acesso anônimo ao site e a privacidade dos projetos. Os dois retornos da prévia já foram salvos pelo proprietário e devem ser preservados.

## Resultados por fase

| Fase | Evidência e limite |
|---|---|
| A · Conta A | O banco continua registrando uma conta confirmada e com entrada anterior. A captura da Missão 09 mostra sessão ativa e leitura de um projeto. Novo login com senha, credenciais inválidas, recarga autenticada e logout ficaram pendentes de ação do titular. |
| B · Conta B | O proprietário informou que não tem segunda caixa de teste. Cadastro, entrega, confirmação, login, recarga e logout da Conta B não foram executados. |
| C · Recuperação | Em Chrome, o callback sem verificador PKCE foi recusado pela aplicação e os parâmetros foram limpos ao voltar ao login. Aceitação de pedido real, entrega, callback com código válido, troca de senha e nova entrada ficaram pendentes. |
| D · CRUD | A leitura agregada e somente leitura mostrou um perfil, um projeto e uma versão. Criação descartável, edição, persistência, timestamps e histórico com as contas reais não foram executados. |
| E · RLS | Três tabelas com RLS ativa e oito políticas no catálogo remoto do Supabase. A Data API recusou leitura anônima nas três tabelas com HTTP 401 e SQLSTATE `42501`. Isolamento entre A/B, permissões de escrita e perda de acesso após logout seguem pendentes em sessões de cliente. |
| F · Clínica ÁUREA | Passou em Chrome 157. Dashboard, contexto seguro, `/clinica/`, WASD, seta, mouse, Avançar/Parar, porta P03 pela API do tour, bloqueio no colisor F060 e alternância problema/proposta em R01–R05. Zero erros HTTP e JavaScript no roteiro. Os sete segmentos devolveram HTTP 200, corresponderam aos hashes individuais e recompuseram 113.018.368 bytes com SHA-256 `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. Quest 2 ficou fora desta regressão. |

Supabase `safevision3d` (`qltabckpluhxnskxgofx`, `us-east-1`) mantém a migração `20261121204325 platform_foundation`. O endpoint público de Auth respondeu HTTP 200 no navegador, com provedor de e-mail habilitado, cadastro permitido e confirmação obrigatória. Nenhum e-mail ou alteração do banco foi disparado pelo roteiro. [Evidência sanitizada](qa-auth-preview-10.json)

## Retomada da homologação

1. Em outro perfil do Chrome, o titular abre a prévia protegida e entra pela seção Conta. Testar uma credencial inválida, entrada válida, recarga, leitura e saída. Registrar o acesso aos dados depois da saída na sessão do cliente. O logout local remove a sessão do navegador. A validade de um token de acesso já emitido segue sua expiração. [Supabase signOut](https://supabase.com/docs/reference/javascript/auth-signout)
2. Testar recuperação com o titular, da solicitação até a entrada com a nova senha, usando a mesma origem e o mesmo perfil em todo o fluxo. Manter credenciais e links ativos no navegador. [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
3. Quando houver segunda caixa autorizada, confirmar B. Criar projetos descartáveis, verificar metadados, timestamps, histórico e recarga. Testar as permissões das duas sessões reais, distinguindo resposta HTTP de bloqueio e zero linhas, e conferir a preservação dos registros preexistentes. Manter os descartáveis até autorização específica de limpeza.

[PR #7 em rascunho](https://github.com/pyedro027/safevision-platform/pull/7), branch `integration/auth-preview-e2e`. Esta revisão altera exclusivamente documentação e evidência.
