# Missão 08 — Ativação da prévia com Supabase

Em 21/11/2026, o PR #7 estava aberto em rascunho. O commit validado para o deploy foi `6a2a92608732430667e1eb7ae29ba34336c6cdf0`, branch `integration/auth-preview-e2e`. O projeto Vercel existente `safevision-platform` da equipe `pyedros-projects` não tinha as duas variáveis de Preview. O Supabase `safevision3d`, em `us-east-1`, estava saudável, com uma migração registrada (`20261121204325`) e RLS ativa nas três tabelas.

## Vercel Preview

- URL canônica protegida: [Preview da Missão 08](https://safevision-platform-2bzty7au8-pyedros-projects.vercel.app/).
- Deployment ID: `dpl_Aq1pu45FoBBxKpAzLXvqZ71TqFza`. Estado: `READY`. O build baixou o commit do GitHub, executou `scripts/build-platform.mjs` e entregou `dist`.
- `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` foram criadas com destino exclusivo `preview`, escopo `integration/auth-preview-e2e`. A listagem posterior confirmou ambos os escopos. O `config.json` retornou HTTP 200 com apenas `url` e `key`. A URL e a publishable key coincidiram com o projeto oficial. Nenhum valor de chave foi registrado.
- A criação foi manual. O deploy automático da branch continua desativado. A produção permaneceu no deploy `dpl_36t2LjWc8yGfNAjngMS5Gy8RC44r` do commit `9624453`, estado `READY`.

## Auth e retornos

O conector permite confirmar o projeto e acessar a Data API, mas não expõe a configuração administrativa do Auth. A sessão do painel necessita da intervenção do responsável. Não foram verificadas administrativamente a Site URL, a lista existente, os templates, SMTP, limites ou proteções contra abuso. Nenhum desses ajustes foi alterado por esta execução.

Acrescentar somente as duas entradas exatas, se ausentes, no [painel de URL Configuration](https://supabase.com/dashboard/project/qltabckpluhxnskxgofx/auth/url-configuration):

1. `https://safevision-platform-2bzty7au8-pyedros-projects.vercel.app/`
2. `https://safevision-platform-2bzty7au8-pyedros-projects.vercel.app/?recuperar=1`

Preservar a lista anterior, a Site URL e as demais configurações. Usar sempre o mesmo hostname canônico e perfil de navegador. Abrir a prévia e autorizar a sessão Vercel antes de iniciar cadastro ou recuperação, para o callback retornar ao navegador com o verificador local. A requisição direta sem sessão Vercel ao caminho de recuperação retornou HTTP 302. A passagem de um código válido pelo retorno de e-mail ainda precisa de teste real.

## Resultados verificados

O Chrome 157 abriu o dashboard na origem HTTPS. O navegador consultou `/auth/v1/settings` do Supabase oficial e recebeu HTTP 200. O provedor de e-mail está ativo, permite signup e exige confirmação. A tela de conta abriu. A recuperação sem verificador mostrou a mensagem de link inválido, expirado ou de outro navegador. Voltar ao login removeu os parâmetros do callback. O teste não enviou e-mail nem trocou um código real. Os casos de código expirado e já usado no servidor continuam pendentes.

Consultas sem sessão às três tabelas pela Data API retornaram HTTP 401 e SQLSTATE `42501`. A inspeção de catálogo confirma RLS ativa. CRUD e isolamento A/B com sessões reais ainda não foram executados. Nenhum dado de teste foi criado nesta missão.

O Chrome renderizou a Clínica ÁUREA a partir de `/clinica/`. Passaram WASD, seta, mouse, Avançar e Parar, abertura representativa da P03 pela API do tour, bloqueio pelo colisor F060 e alternância PROB/CORR nos cinco casos. O primeiro roteiro procurou o identificador abreviado F060, que não existia como ID exato. O roteiro foi corrigido para o ID completo da caixa e passou sem mudança no visualizador. Não houve erro HTTP ou de console no roteiro aprovado. Os sete segmentos retornaram HTTP 200 e coincidiram com os hashes individuais. O GLB recomposto tem 113.018.368 bytes e SHA-256 `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. O contexto era seguro, mas o Chrome desktop não ofereceu sessão XR imersiva. [Evidência sanitizada](qa-auth-preview-08.json)

Resultado da missão: **conclusão parcial**. A prévia e a conectividade pública real do dashboard foram verificadas. Os redirecionamentos e o uso com duas contas permanecem pendentes.

## Roteiro para duas caixas controladas

O responsável deve autorizar Usuário A e Usuário B e usar contextos distintos de navegador. Cada contexto deve ter acesso à prévia antes do cadastro. Registrar separadamente aceitação do pedido, entrega do e-mail, confirmação e sessão autenticada. Conferir também conta não confirmada, credenciais inválidas, persistência, logout, recuperação, senha atualizada e login com a senha nova. Senhas e links permanecem com o responsável.

Em cada sessão criar e editar apenas um projeto descartável, conferir histórico e recarregar. Usar sessões de cliente para verificar acesso cruzado, alterações de proprietário e referência de modelo, escrita de histórico e sessão expirada. Distinguir HTTP negado de zero linhas. Nenhum registro existente deve ser utilizado para teste.
