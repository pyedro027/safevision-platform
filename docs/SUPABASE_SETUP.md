# Preparação do Supabase

O projeto confirmado é `safevision3d` (`qltabckpluhxnskxgofx`), região `us-east-1`, estado `ACTIVE_HEALTHY`. Em 21/11/2026, após aprovação técnica e autorização escopada à branch principal, a migração foi aplicada e identificada no histórico como `20261121204325`. O arquivo renomeado `supabase/migrations/20261121204325_platform_foundation.sql` preserva o SQL do arquivo original `20261121194021_platform_foundation.sql`. Não reaplique o timestamp anterior a partir de branches históricas.

O catálogo PostgreSQL 17.12 confirmou três tabelas, RLS ativa, oito políticas, duas funções e três gatilhos. O teste sem sessão pela Data API retornou HTTP 401 nas três tabelas. O teste com duas contas Auth continua pendente. Nenhuma configuração Auth, URL ou chave foi alterada. Consulte [o relatório da migração](RELATORIO_MIGRACAO_SUPABASE_06.md).

Alternativa gratuita e isolada: usar a pilha Supabase local com runtime de contêiner. Docker não estava disponível nesta sessão Windows. Uma branch hospedada é isolada, mas pode ter cobrança. Não foi criada. O projeto confirmado deve ser reaproveitado conforme autorização do responsável.

O esquema contém `profiles`, `projects` e `project_versions`. O histórico registra automaticamente criação e mudança real de título ou descrição. O dashboard lista, cria, edita e exclui metadados no projeto próprio. A exclusão confirmada também remove o histórico do registro.

No destino autorizado para a próxima etapa, verifique a configuração do provedor de e-mail do Supabase Auth. Configure Site URL e Redirect URLs apenas para a origem prevista e o endereço local usado nos testes. Permita também a URL de recuperação com `?recuperar=1`. O fluxo PKCE deve ser concluído no navegador que solicitou o link.

Exporte `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no ambiente que executa `node scripts/build-platform.mjs`. Em uma futura prévia, configure ambas com escopo Preview e valide as origens de redirecionamento. A chave publishable será lida pelo navegador em `config.json`. A política de acesso fica no banco. Nunca passe uma chave administrativa. Sem as variáveis, a demonstração abre normalmente e o dashboard sinaliza que contas e projetos estão indisponíveis.

Teste remoto quando o projeto estiver disponível. Confirme cadastro, entrega e confirmação de e-mail, login, persistência após recarregar, logout, redefinição de senha e CRUD com duas contas de teste. Valide a negativa de leitura, edição e exclusão dos registros de outra conta. A simulação do Chrome local não envia e-mails nem confirma a configuração do Auth remoto.

Para modelos próprios futuros, a coluna opcional `model_object_key` reserva a referência de Storage no projeto e no histórico. O cliente não tem permissão para gravá-la. Avaliar bucket privado, chaves por proprietário/projeto, políticas de Storage, URLs assinadas, upload retomável e limites do plano. O Storage Free documenta 50 MB por arquivo. A Clínica ÁUREA permanece no pacote estático. Nenhum bucket ou fluxo de upload foi criado.

- [Cobrança e cotas de projetos](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Cadastro com e-mail](https://supabase.com/docs/reference/javascript/auth-signup)
- [Limites de Storage](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Supabase local](https://supabase.com/docs/guides/local-development)
- [Cobrança de branches](https://supabase.com/docs/guides/platform/manage-your-usage/branching)

O [plano da Missão 07](PLANO_AUTH_PREVIEW_07.md) especifica os dois retornos propostos e o ensaio remoto. O cadastro e a confirmação obrigatória foram verificados no endpoint público `/auth/v1/settings`. Ainda é necessário entrar no painel administrativo e conferir a lista atual de retornos, Site URL, templates, SMTP e limites antes de salvar qualquer alteração.

Na Missão 08 o commit corrigido foi implantado noutro domínio. Use somente as duas URLs exatas do [relatório da Missão 08](RELATORIO_MISSAO_08.md), em substituição à proposta histórica da Missão 07. A sessão administrativa e a alteração da lista continuam pendentes. A migração já aplicada permanece `20261121204325`.
