# Autorização e dados privados

- O Supabase Auth gerencia as credenciais e a sessão. O SDK oficial 2.119.2 está fixado no pacote com licença e SHA-256. O build aceita somente chave publishable. Chaves administrativas e arquivos de configuração com credenciais ficam fora da distribuição e do Git.
- As três tabelas têm RLS ativa. O papel anônimo fica sem acesso. O ID do usuário autenticado vem de `auth.uid()` e o padrão do banco define o proprietário. As permissões por coluna impedem informar ou editar proprietário, ID, timestamps e histórico diretamente.
- Projetos e perfis são acessíveis apenas aos respectivos proprietários. O histórico é legível pelo proprietário do projeto e gravado somente pelo gatilho de banco em esquema privado, com `search_path` vazio e execução revogada dos papéis cliente.
- O dashboard escapa título, descrição, nome e histórico antes de montar HTML. Ao trocar a conta ou encerrar a sessão, limpa os dados carregados. A interface não substitui as políticas do banco.
- A demonstração 3D é pública dentro da origem de teste. Os ativos do modelo são documentos de referência da demonstração. Para futuros modelos privados, use bucket privado, validação de tamanho e tipo e acesso por projeto.
- A verificação PGlite executa a migração e testa dois usuários simulados, criação, mutações próprias, ataques de troca de proprietário, escrita direta de histórico e acesso anônimo. A validação com tokens reais e o gateway PostgREST continua pendente.
