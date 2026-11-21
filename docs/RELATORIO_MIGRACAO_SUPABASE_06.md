# Missão 06 — Migração controlada

## Revisão antes da escrita

Em 21/11/2026, o destino autorizado `safevision3d` (`qltabckpluhxnskxgofx`, `us-east-1`) estava `ACTIVE_HEALTHY`. O PostgreSQL 17.12 confirmou papel de execução `postgres`, privilégio de criação no banco e em `public`, `REFERENCES` em `auth.users`, `auth.uid()`, `gen_random_uuid()` e os papéis cliente. Não havia relações, políticas, funções ou gatilhos de usuário em `public`, esquema `safevision_private` ou migrações. A identidade e o histórico vazio foram conferidos novamente antes da aplicação. Veja [o registro de catálogo](qa-supabase-remote.json).

O SQL original `supabase/migrations/20261121194021_platform_foundation.sql` foi lido do commit remoto `5102b4d319b0720a14055a7551cae13c38f021cf`. É o mesmo blob Git `0f1f9431eca8f8b05b6c1eaefc02e1aa710c9082` do PR #4 e do commit `e96b957`. O SHA-256 dos 4.568 bytes é `d84a34a2063c09a71765598b6cbdbc5bc20ab4dd96ea9eb3f5581840e4146d9c`.

A revisão aprovou o SQL sem alterações. A migração cria objetos e concede ou revoga permissões somente nesses objetos. As FKs têm cascata para futuras exclusões autorizadas, sem exclusão de dados na aplicação do SQL. O cliente autenticado cria o projeto com `auth.uid()` como proprietário. Os grants proíbem atribuir ou alterar ID, proprietário, timestamps e referência de modelo. As políticas de edição validam a linha anterior e a resultante. O histórico é legível pelo proprietário do projeto e não aceita escrita direta pelo cliente. As chaves, índices e restrições correspondem ao esquema revisado.

`touch_project()` é invoker. O gatilho de histórico usa `record_project_version()` como definer para gravar sem conceder escrita ao cliente. As duas funções fixam `search_path` vazio. A gravação usa `public.project_versions` qualificada, com dados de `NEW` e sem SQL dinâmico. O esquema privado não concede `USAGE` aos papéis cliente e as duas funções revogam `EXECUTE` de PUBLIC, anon e authenticated. Os gatilhos de edição registram apenas mudanças de metadados.

Referências consultadas: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [privilégios por coluna](https://supabase.com/docs/guides/database/postgres/column-level-security), [segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api) e [PostgreSQL 17 CREATE FUNCTION](https://www.postgresql.org/docs/17/sql-createfunction.html).

## Aplicação e histórico

O conector oficial `apply_migration` recebeu o SQL do Git uma única vez com o nome `platform_foundation` e respondeu `success: true`. A CLI local não tinha sessão autenticada. O conector não aceita versão explícita e o histórico registrou `20261121204325`. O arquivo foi renomeado para `supabase/migrations/20261121204325_platform_foundation.sql` com os bytes originais para manter a correspondência com o histórico remoto. Não foi criada uma cópia nem foi executada uma segunda migração.

Use esta branch ou uma sucessora que incorpore o novo caminho antes de usar `db push` no destino. Branches históricas ainda têm o timestamp anterior. Não tente reaplicá-lo no projeto remoto.

## Evidência depois da aplicação

- Três tabelas com RLS, oito políticas para `authenticated`, cinco índices e três gatilhos habilitados. As colunas, chaves, restrições, definições de políticas e privilégios estão em [qa-supabase-remote.json](qa-supabase-remote.json).
- `anon` sem SELECT, INSERT, UPDATE ou DELETE. GET pela Data API, com chave publishable e sem sessão, foi negado para `profiles`, `projects` e `project_versions` com HTTP 401 e código PostgreSQL `42501`.
- `authenticated` tem SELECT sujeito a RLS e grava apenas `display_name` em perfis ou `title` e `description` em projetos. DELETE de projeto é condicionado à política de proprietário. O catálogo confirmou que os papéis cliente não podem executar as funções nem acessar o esquema privado.
- O teste PGlite verificou dois papéis simulados, CRUD, histórico, isolamento e ausência de nova versão quando os metadados não mudam. O catálogo confirma gatilhos ativos remotamente. Sua execução com projetos de contas Auth reais ainda está pendente. Nenhum usuário, sessão ou registro de teste foi criado no remoto.

## Preparação para a próxima prévia

`scripts/build-platform.mjs` exige as duas variáveis juntas e só aceita chave `sb_publishable_...`. O build escreve a configuração pública em `dist/config.json`. O dashboard usa essa configuração para inicializar o SDK com PKCE e habilitar ações privadas somente com sessão. As políticas do banco aplicam a autorização de fato.

A URL confirmada é `https://qltabckpluhxnskxgofx.supabase.co`. A chave publishable ativa foi localizada pelo conector oficial. Seu valor não foi registrado. Na próxima etapa, configurar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` somente no ambiente Preview e autorizar as URLs exatas de retorno do Auth, incluindo `?recuperar=1`. Validar cadastro, e-mail, login, recuperação, logout e CRUD com duas contas de teste autorizadas. A produção Vercel e a prévia publicada permaneceram em `READY` nos mesmos deploys. Nenhum ambiente Vercel ou ajuste remoto de Auth foi modificado nesta missão.
