# Preparação do Supabase

O projeto confirmado é `safevision3d` (`qltabckpluhxnskxgofx`), região `us-east-1`, estado `ACTIVE_HEALTHY`. Em 21/11/2026 o conector listou zero tabelas públicas, zero políticas públicas, zero migrações e nenhuma branch isolada. A branch principal está designada produção. A migração `supabase/migrations/20261121194021_platform_foundation.sql` aguarda autorização explícita para escrita nesse destino.

Uma consulta de leitura confirmou PostgreSQL 17.12, `auth.users`, `auth.uid()` e `gen_random_uuid()`. O SQL passou novamente em PostgreSQL local via PGlite 0.5.17. Isso valida a migração e seus pré-requisitos observáveis, sem executar DDL no remoto. Nenhuma configuração Auth, URL ou chave foi alterada.

Alternativa gratuita e isolada: usar a pilha Supabase local com runtime de contêiner. Docker não estava disponível nesta sessão Windows. Uma branch hospedada é isolada, mas pode ter cobrança. Não foi criada. O projeto confirmado deve ser reaproveitado conforme autorização do responsável.

O esquema contém `profiles`, `projects` e `project_versions`. O histórico registra automaticamente criação e mudança real de título ou descrição. O dashboard lista, cria, edita e exclui metadados no projeto próprio. A exclusão confirmada também remove o histórico do registro.

Em um ambiente de desenvolvimento dedicado e aprovado, aplique a migração versionada e confira o diff do esquema. Verifique a configuração do provedor e-mail do Supabase Auth. Configure Site URL e Redirect URLs apenas para a origem prevista e o endereço local usado nos testes. Permita também a URL de recuperação com `?recuperar=1`. O fluxo PKCE deve ser concluído no navegador que solicitou o link.

Exporte `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no ambiente que executa `node scripts/build-platform.mjs`. Em uma futura prévia, configure ambas com escopo Preview e valide as origens de redirecionamento. A chave publishable será lida pelo navegador em `config.json`. A política de acesso fica no banco. Nunca passe uma chave administrativa. Sem as variáveis, a demonstração abre normalmente e o dashboard sinaliza que contas e projetos estão indisponíveis.

Teste remoto quando o projeto estiver disponível. Confirme cadastro, entrega e confirmação de e-mail, login, persistência após recarregar, logout, redefinição de senha e CRUD com duas contas de teste. Valide a negativa de leitura, edição e exclusão dos registros de outra conta. A simulação do Chrome local não envia e-mails nem confirma a configuração do Auth remoto.

Para modelos próprios futuros, a coluna opcional `model_object_key` reserva a referência de Storage no projeto e no histórico. O cliente não tem permissão para gravá-la. Avaliar bucket privado, chaves por proprietário/projeto, políticas de Storage, URLs assinadas, upload retomável e limites do plano. O Storage Free documenta 50 MB por arquivo. A Clínica ÁUREA permanece no pacote estático. Nenhum bucket ou fluxo de upload foi criado.

- [Cobrança e cotas de projetos](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Cadastro com e-mail](https://supabase.com/docs/reference/javascript/auth-signup)
- [Limites de Storage](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Supabase local](https://supabase.com/docs/guides/local-development)
- [Cobrança de branches](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
