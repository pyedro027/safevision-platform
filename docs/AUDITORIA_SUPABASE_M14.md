# Auditoria Supabase — Missão 14

Em 21/11/2026, o conector confirmou safevision3d, qltabckpluhxnskxgofx, us-east-1, saudável, PostgreSQL 17.12. O histórico remoto continha apenas 20261121204325_platform_foundation. O catálogo público listou profiles, projects e project_versions, todos com RLS.

| Tabela | Chave e vínculos | Índices e políticas |
|---|---|---|
| profiles | id referencia auth.users, exclusão em cascata | PK, três políticas pela identidade do perfil |
| projects | id como PK, owner_id referencia auth.users com cascata | PK e projects_owner_recent, quatro políticas pelo proprietário |
| project_versions | id como PK, project_id referencia projects com cascata | PK e project_versions_recent, leitura via projeto pertencente ao usuário |

As restrições limitam nome a 1–100, título a 1–120, descrição a 2000 e referência de modelo opcional a 1–512 caracteres. O papel anon não possui grants de tabela nessas relações. authenticated tem SELECT nas três, DELETE em projects e INSERT/UPDATE por coluna em nome de exibição, título e descrição. Os gatilhos touch_project, record_new_project e record_project_edit atualizam data e histórico. As funções touch_project e record_project_version ficam no schema safevision_private, com search_path vazio e execução concedida apenas a postgres. A segunda roda como definidor para registrar histórico.

A variável pgrst.db_schemas ficou indisponível no catálogo consultado. A exposição de public tem evidência histórica da Data API nas missões 09 e 10, e precisa ser reconfirmada antes do Marco B. Nenhuma configuração administrativa foi modificada.

O frontend usa chave publicável, Auth PKCE e armazenamento de sessão do SDK. O logout local remove a sessão do cliente. A troca de identidade desmonta inspeções, cancela fetches e recarrega rascunhos do escopo novo. A camada remota confere a identidade e expiração da sessão retornada pelo SDK e vincula a chamada ao token daquela sessão. Um JWT previamente emitido segue sua validade até expirar.

A proposta da Missão 13 já restringia propriedade e colunas. Para sincronização, faltavam data de criação, revisão imutável controlada pelo servidor e proteção contra concorrência. A revisão usa chave composta, índice da chave e gravações condicionais por UUID. Evita upsert genérico, que poderia substituir dados sem verificar a revisão.

[Changelog](https://supabase.com/changelog.md) · [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Data API](https://supabase.com/docs/guides/api/securing-your-api)
