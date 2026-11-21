# SAFEVISION Platform V1

## Preserve a referência

- Leia [docs/CONTINUIDADE_IA.md](docs/CONTINUIDADE_IA.md) e confira o estado das branches e dos PRs antes de retomar.
- Preserve os 42 arquivos da Versão C em `apps/viewer/`, o Babylon.js, o modelo GLB em sete segmentos e seus hashes. Não altere materiais, iluminação, geometria, portas, colisores, navegação, fichas, estados R01–R05 ou WebXR sem autorização e verificação de regressão.
- Desenvolva em branch separada e abra PR para revisão. Não faça merge na main, force push, publicação em produção ou alteração de serviços existentes fora do escopo autorizado.
- Use somente ambientes de desenvolvimento identificados. Confirme plano e custo quando houver possibilidade de cobrança. Mantenha credenciais e dados privados fora do Git, do build público e dos relatórios.
- Separe evidência local, API simulada, integração remota e homologação física. Nunca apresente sucesso simulado como integração real.

## Relatório obrigatório de continuidade

Ao concluir **toda tarefa SAFEVISION**, entregue na própria conversa o Markdown completo com o título **SAFEVISION PLATFORM V1 — RELATÓRIO DE CONTINUIDADE PARA O CHATGPT**, pronto para copiar. Use esta ordem:

1. **A. Identificação** — data, objetivo, repositório, branch, PRs e estado geral.
2. **B. Atividades realizadas** — concluído, parcial e não realizado.
3. **C. Arquivos modificados** — caminhos reais, ações e motivos.
4. **D. GitHub** — branches, commits, PRs, links, envios, mudanças locais, merges e conflitos.
5. **E. Vercel** — projeto, ambiente, URL, commit, deploy, testes e pendências.
6. **F. Supabase** — projeto, região, conexão, tabelas, migrações, Auth, RLS, testes e pendências.
7. **G. Testes e qualidade** — método, resultado, evidência e limites.
8. **H. Problemas e pendências** — causa, impacto e resolução proposta.
9. **I. Estado atual do SAFEVISION** — dashboard, Clínica ÁUREA, R01–R05, navegação, WebXR, Auth, projetos, banco e HTTPS.
10. **J. Próximas etapas** — ordem e dependências.
11. **K. Instruções para o próximo agente** — o que preservar, arquivos, PRs e primeira ação.

Indique explicitamente quando uma seção não se aplica ou o estado não foi revalidado. Atualize `docs/CONTINUIDADE_IA.md` quando houver informações novas, preserve orientações úteis e versione a documentação na branch da tarefa. Inclua links de recursos publicados, sem senhas, tokens ou dados confidenciais.
