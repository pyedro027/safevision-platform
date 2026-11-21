# Missão 09 — Autenticação e homologação da prévia

Em 21/11/2026 a homologação ficou **parcial**. A Conta A está confirmada e apareceu autenticada no dashboard com um projeto existente. A validação de gravações, recuperação e isolamento entre contas continua pendente.

## Ambientes

- GitHub `pyedro027/safevision-platform`, branch `integration/auth-preview-e2e`, [PR #7 em rascunho](https://github.com/pyedro027/safevision-platform/pull/7).
- Vercel `safevision-platform`, equipe `pyedros-projects`, Preview protegida `dpl_Aq1pu45FoBBxKpAzLXvqZ71TqFza`, estado `READY`, commit `6a2a92608732430667e1eb7ae29ba34336c6cdf0`. A produção continuou em `dpl_36t2LjWc8yGfNAjngMS5Gy8RC44r`. [URL canônica](https://safevision-platform-2bzty7au8-pyedros-projects.vercel.app/)
- Supabase `safevision3d` (`qltabckpluhxnskxgofx`, `us-east-1`), migração já registrada `20261121204325 platform_foundation`. RLS ativa em `profiles`, `projects` e `project_versions`.

## Evidências de autenticação e dados

| Verificação | Resultado |
|---|---|
| URLs de retorno | O responsável informou que salvou o endereço canônico acima e o mesmo endereço com `?recuperar=1` e os viu persistirem após recarregar o painel. |
| Cadastro e entrega | O responsável relatou recebimento do e-mail de confirmação do cadastro. |
| Confirmação e entrada registradas | Consulta agregada e somente leitura a `auth.users` encontrou uma conta ativa, uma confirmação, zero confirmações pendentes e uma conta com entrada registrada. |
| Sessão e leitura | Captura fornecida pelo responsável mostra uma sessão ativa na Visão geral e um projeto existente. A captura com dado pessoal permaneceu fora do Git. |
| Configuração pública de Auth | `/auth/v1/settings` retornou HTTP 200 no Chrome. E-mail e cadastro habilitados, confirmação obrigatória. Site URL, SMTP, templates e limites aguardam inspeção administrativa de leitura. |
| Recuperação | Passou a verificação do retorno sem verificador PKCE. A interface informou o erro e limpou a URL ao voltar ao login. Solicitação, e-mail, callback válido, alteração e entrada com senha nova ainda pendentes. |
| Leitura anônima | A Data API com chave publicável, sem sessão, devolveu HTTP 401 e SQLSTATE `42501` nas três tabelas. |
| Testes com sessão | Login novo com senha, credenciais inválidas, persistência após recarregar, logout, gravações e histórico, isolamento A/B e tentativas de gravações vedadas com sessão de cliente seguem pendentes. |

O serviço SMTP padrão pode restringir destinatários e volume. O recebimento pela Conta A comprova entrega àquela caixa. Qualquer restrição para a Conta B precisa ser identificada pela resposta efetiva e pela inspeção do painel. [Documentação oficial de SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

## Clínica ÁUREA e integridade

Chrome 157 abriu o dashboard e renderizou `/clinica/` em contexto seguro. Passaram teclado, mouse, Avançar/Parar, a porta P03 pela API do tour, a colisão representativa F060 e a alternância problema/proposta nos cinco riscos. O roteiro registrou zero falhas HTTP e de console. Os sete segmentos retornaram HTTP 200, passaram a conferência individual e recompuseram 113.018.368 bytes com SHA-256 `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. O Chrome desktop indicou ausência de sessão XR imersiva. A homologação física no Quest 2 continua pendente. [Evidência sanitizada](qa-auth-preview-09.json)

## Retomada

1. Abrir a prévia canônica em outro perfil Chrome, autorizar o acesso Vercel e entrar com a Conta A. Validar credenciais inválidas, login válido, recarga e logout. Registrar só resultados.
2. Confirmar uma segunda caixa sob controle do responsável. Cadastrar a Conta B e confirmar dentro do perfil em que o cadastro começou. Usar o mesmo hostname e perfil em cada fluxo PKCE. Se for preciso usar o mesmo perfil sequencialmente, validar o logout antes de trocar de conta.
3. Em Conta, solicitar recuperação, abrir o link recebido no mesmo perfil Chrome e verificar atualização e entrada com a senha nova. Manter senhas, códigos e links ativos fora da conversa. [Documentação oficial de PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
4. Com cada conta, criar um projeto descartável, editar título e descrição, conferir histórico e recarregar. Com sessões reais dos clientes, verificar isolamento de leitura, edição e exclusão e do histórico. Registrar zero linhas e recusas HTTP separadamente e verificar se os dados do titular permanecem intactos. Conferir proteção de `owner_id`, `model_object_key`, histórico e sessão encerrada. Preservar todos os registros preexistentes.

As evidências foram obtidas com leitura do Supabase, requisições de cliente sem sessão, teste de navegador na prévia e captura do responsável. O código, os arquivos da Clínica ÁUREA e o esquema permaneceram intactos. A missão manteve a mesma implantação de prévia e a mesma produção.
