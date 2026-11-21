# Missão 07 — auditoria e plano de ativação

## Estado verificado

O PR #6 está aberto em rascunho no commit `115dc230d4ad242ba8687a6f482028bf91d54ed6`. O histórico do Supabase contém `20261121204325_platform_foundation`. A inspeção pública de Auth do projeto `safevision3d` retornou HTTP 200 com provedor de e-mail ativo, cadastro permitido e autoconfirmação desativada. O painel administrativo abriu uma tela de login. O conector não oferece leitura da configuração administrativa de Auth. Site URL, allowlist existente, templates, SMTP, limites e proteção contra abuso ainda precisam de inspeção autenticada. Nenhuma configuração foi inferida como padrão.

A listagem Vercel sem descriptografia não mostrou as variáveis de Preview pretendidas. O `config.json` do alias candidato retornou HTTP 200 e `{}`, logo o dashboard ainda não usa o banco remoto. O alias está protegido por Vercel Authentication. Para confirmar e-mails, cada participante deve autorizar acesso à Vercel no mesmo perfil que iniciou a operação e abrir o retorno no mesmo navegador e origem. A passagem real do código PKCE pelo login Vercel fica para o ensaio autorizado.

## Alterações a aprovar

**Vercel** — projeto `safevision-platform`, equipe `pyedros-projects`. Criar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` exclusivamente em Preview para a branch `integration/supabase-remote-validation`. A referência é o commit `115dc23`, que tem o alias já conhecido abaixo. Depois da aprovação, criar uma prévia desse commit para efetivar os valores e conferir o alias. O build deve produzir um `config.json` com apenas `url` e `key`. A chave ativa identificada pelo conector é publishable. Seu valor não fica no Git nem no relatório.

**Supabase Auth** — projeto `safevision3d`. Conferir a lista atual e acrescentar somente as duas entradas a seguir, caso ausentes. Nenhum curinga é necessário.

1. `https://safevision-platform-git-integration-sup-bcd437-pyedros-projects.vercel.app/`
2. `https://safevision-platform-git-integration-sup-bcd437-pyedros-projects.vercel.app/?recuperar=1`

Preservar Site URL, entradas existentes, confirmação de cadastro, templates, SMTP, limites e controles de abuso nesta mudança proposta. Antes do ensaio, conferir se os templates respeitam o retorno configurado e se o SMTP atual entrega para as duas caixas autorizadas. O SMTP padrão tem restrições de destinatário e taxa segundo a documentação. O projeto não foi classificado como padrão nem personalizado sem leitura administrativa.

A branch de revisão `integration/auth-preview-e2e` desativa apenas o deploy automático da própria branch por `git.deploymentEnabled`, para publicar o PR sem disparar outra prévia antes da autorização. Seu ajuste de recuperação é um candidato separado. Se for implantado em outro alias, confirme a nova URL e a allowlist antes dos ensaios.

## Auditoria da aplicação e testes

O SDK local usa PKCE, armazenamento de sessão do SDK e o evento `PASSWORD_RECOVERY`. O cadastro retorna à raiz e a recuperação à raiz com `recuperar=1`. A recuperação salva via `updateUser`. O logout usa escopo local e limpa os dados renderizados. Perfil e projetos são consultados só com sessão. A interface usa operações PostgREST com escrita limitada aos metadados editáveis. O histórico tem leitura por ID do projeto. A autorização real permanece no RLS da migração já aplicada.

O ensaio encontrou que abrir recuperação fora do navegador iniciador levava à visão geral, pois o SDK não emite `PASSWORD_RECOVERY` sem troca PKCE. O ajuste direciona a tela de recuperação desde o retorno, conserva o formulário enquanto os projetos carregam e retira os parâmetros de callback ao voltar ao login ou salvar. O build e o Chrome local confirmaram desafio S256, verificador correspondente no mesmo navegador, rejeição sem verificador em outro navegador, troca de código de cadastro e recuperação, atualização de senha e credenciais inválidas com API simulada. A suíte também percorreu sessão, perfil, CRUD, histórico e layout móvel. Nenhum e-mail foi enviado.

## Ensaio remoto depois das aprovações

1. Confirmar o mesmo alias em todo o ensaio. Conferir variáveis e respostas HTTP sem registrar seus valores. Testar a Clínica ÁUREA e a integridade do GLB no novo deploy.
2. Com duas caixas controladas e autorizadas, cadastrar, observar entrega, confirmar, entrar, recarregar, editar perfil, recuperar senha e sair. Testar credenciais inválidas. Se o SMTP bloquear destinatários, registrar o erro antes de propor ajustes adicionais.
3. Em dois contextos de navegador separados, criar somente projetos descartáveis. A e B devem conseguir CRUD próprio. B deve receber zero linhas para leitura, edição e exclusão do projeto de A e para consulta de histórico de A. Conferir que A ainda vê o registro após os testes de B. Verificar que o cliente não pode gravar `owner_id` ou `model_object_key` e que uma requisição sem sessão recebe negativa. Não usar a chave administrativa nem publicar identificadores ou tokens de sessão.
4. Registrar resultados sanitizados, distinguir email entregue de mensagem de envio exibida pela interface e apagar somente os projetos descartáveis da rodada se autorizado.

[Supabase — PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) · [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) · [SMTP](https://supabase.com/docs/guides/auth/auth-smtp) · [Variáveis Vercel por branch](https://vercel.com/docs/environment-variables) · [Configuração Git Vercel](https://vercel.com/docs/project-configuration/git-configuration)
