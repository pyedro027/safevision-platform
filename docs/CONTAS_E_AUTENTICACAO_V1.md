# Conta e autenticação

O cliente estático usa o SDK local @supabase/supabase-js 2.119.2, com SHA conferido pelo build. A configuração pública do ambiente fica em dist/config.json. O SDK administra a sessão, a renovação e o verificador PKCE. A aplicação não cria outro depósito de tokens ou senhas.

## Ciclo da sessão

Ao abrir a plataforma, o SDK resolve a sessão. A área privada aguarda a verificação de identidade por getUser com o token da sessão restaurada. Uma resposta atrasada perde validade quando chega um evento de sessão mais recente. Uma falha de verificação apresenta nova tentativa. A leitura de perfil e projetos ocorre fora do callback de Auth, respeitando o bloqueio interno do SDK. A barra usa o nome confirmado do perfil e, na ausência dele, o e-mail da sessão. O logout local encerra a sessão do navegador e o SDK comunica a mudança às abas.

## Entrar, cadastrar e recuperar

A página Conta permite preencher credenciais, alternar visibilidade da senha, criar conta e solicitar recuperação. O campo de senha usa o autocomplete adequado ao modo. O servidor valida a política de senha. Na entrada, o destino pode ser o início, a carteira ou um UUID da rota interna de projeto. O destino é derivado do hash permitido. Um projeto indisponível recebe a mesma resposta visual para ausência ou falta de acesso.

O cadastro usa signUp e o login usa signInWithPassword. O cadastro sem sessão pede confirmação por e-mail. A solicitação de recuperação usa resetPasswordForEmail com resposta neutra. O formulário de nova senha depende de PASSWORD_RECOVERY e da identidade correspondente. Digitar o parâmetro recuperar em uma sessão comum não habilita a operação. O verificador depende do navegador que iniciou o fluxo. Após a troca, a aplicação limpa os parâmetros do callback.

O perfil aceita nome de exibição com até 100 caracteres. A criação envia apenas display_name. A edição condiciona o UPDATE ao ID da sessão. O backend fornece o identificador padrão e impõe a propriedade por RLS. Falha de leitura impede edição baseada em estado desconhecido.

## Revisão local pelo proprietário

Abra [Conta no servidor local](http://127.0.0.1:4181/#conta). A distribuição local preparada nesta entrega aponta para o projeto hospedado com chave publicável. O login voluntário do titular e a gravação de um projeto próprio usam dados reais. Para validar apenas a aparência com dados de teste, consulte as capturas. A configuração pública local não faz parte do commit. Um build sem variáveis restaura a demonstração sem backend.

O histórico anterior de URLs autorizadas cobre a prévia Vercel. Confirmação e recuperação iniciadas em loopback dependem da lista de redirecionamentos aceita pelo serviço. A Missão 15 não adicionou URLs nem enviou e-mails. A homologação remota do ciclo completo continua pendente.

Referências consultadas em 24/11/2026. [Auth](https://supabase.com/docs/guides/auth) · [Fluxos por senha](https://supabase.com/docs/guides/auth/passwords) · [Changelog](https://supabase.com/changelog.md).
