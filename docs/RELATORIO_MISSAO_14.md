# Missão 14 — Marco A

A branch parte do PR #10 em e6e664e. Foram implementados a leitura compatível de rascunhos, o armazenamento por identidade, a sincronização manual protegida por revisão, a escolha de versão em conflito, a preservação das versões substituídas e a importação voluntária. O relatório A4 distingue a origem de cada avaliação.

A auditoria remota usou somente metadados. A migração foi gerada com Supabase CLI 3.2.0 e executada no PostgreSQL isolado via PGlite. O adaptador de testes aplicou no banco real as operações do cliente com identidades controladas. Docker e seu serviço local estavam indisponíveis. O Chrome usou respostas Auth e Data API simuladas para exercitar a interface e produzir as capturas identificadas. As evidências não representam uma autenticação hospedada ou uma nuvem ativa.

Passaram o teste de isolamento e concorrência, as regressões de inspeções e A4, Studio e PDFs oficiais, 42 arquivos do visualizador, motor e permissões dos projetos existentes. O Chrome verificou a comparação de conflitos nas larguras de 375, 430, 768, 1024, 1440 e 1920 px. Quest 2 e avaliação direta com leitor de tela continuam pendentes.

[Auditoria](AUDITORIA_SUPABASE_M14.md) · [Persistência](PERSISTENCIA_INSPECOES_V1.md) · [Sincronização](SINCRONIZACAO_INSPECOES_V1.md) · [Segurança](SEGURANCA_RLS_M14.md) · [Ativação futura](PLANO_ATIVACAO_REMOTA_M14.md) · [Evidências](evidencias-missao-14/)
