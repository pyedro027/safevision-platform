# Segurança de contas e projetos

## Catálogo hospedado em 24/11/2026

Projeto safevision3d, qltabckpluhxnskxgofx, us-east-1. A auditoria consultou identidade, catálogo, índices, constraints, grants de coluna, políticas, funções privadas, gatilhos, migrações e advisor. As três tabelas public.profiles, public.projects e public.project_versions têm RLS habilitada. Oito políticas controlam as operações por auth.uid() ou pelo pai que pertence à conta. As chaves primárias e os índices projects_owner_recent e project_versions_recent sustentam as leituras. As FKs para auth.users e do histórico para projects usam exclusão em cascata.

O papel authenticated recebe leitura. Em profiles, a escrita se limita a display_name. Em projects, título e descrição podem ser inseridos/alterados e a linha própria pode ser excluída. O cliente não define owner_id, datas ou model_object_key. O histórico só é gravado pelos gatilhos. A função privada record_project_version usa SECURITY DEFINER com search_path fixado e sem EXECUTE público. touch_project atualiza a data quando o conteúdo muda. O visitante não tem grants para gravar projetos. A única migração registrada é 20261121204325_platform_foundation. A Missão 14B permanece suspensa.

A configuração pública de Auth indicou e-mail habilitado, cadastro permitido e confirmação exigida. A raiz REST respondeu HTTP 401 à chave publicável isolada. A configuração pgrst.db_schemas não apareceu nessa sessão de catálogo. Esses resultados não demonstram por si sós a exposição administrativa completa nem o transporte de uma sessão hospedada. O advisor ainda aponta a proteção de senhas vazadas desativada. Sua eventual habilitação requer decisão administrativa e verificação de disponibilidade do plano.

## Limites no cliente

O SDK de dados recebe um provedor de token que verifica expiração e identidade esperada em cada chamada. Cada identidade tem um AbortController. Trocar a sessão fecha o diálogo, invalida consultas e esvazia perfil, projetos e busca. Uma resposta antiga não pode preencher um histórico cujo elemento saiu da página. O proprietário gravado no banco e as políticas constituem o controle de acesso efetivo. Um identificador na barra de endereço não concede autorização.

Campos de usuário são escapados na apresentação. O filtro de redirecionamento aceita apenas destinos internos conhecidos. A interface utiliza a chave publicável. O build recusa chaves fora do formato permitido. O filtro de updated_at evita substituir uma edição concorrente detectada. O banco continua sendo autoridade sobre integridade, limites e permissões.

## Evidência e limites

PGlite executou a migração de fundação em um banco descartável. A e B têm UUIDs diferentes. Foram exercitados criação própria, isolamento de consulta/alteração/exclusão, bloqueio da escrita no histórico e no proprietário, acesso anônimo, snapshots e cascata. O navegador operou o SDK distribuído usando endpoints simulados. Uma stack integrada de Auth, PostgreSQL e PostgREST com JWTs locais e uma sessão voluntária hospedada são níveis de verificação distintos e seguem pendentes.

[Segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api) · [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Proteção de senhas](https://supabase.com/docs/guides/auth/password-security).
