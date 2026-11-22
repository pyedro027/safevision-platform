# Inspeções da Clínica ÁUREA

Abra Inspeções no menu ou pela página da clínica. Escolha uma ficha, consulte o ambiente, o problema e a proposta do arquivo oficial em apps/viewer/WEB/data/fichas. Visualizar em 3D abre o tour original no caso escolhido. Voltar à ficha libera o iframe e preserva a edição em andamento.

Cada salvamento guarda status, observações, recomendação e data no localStorage da origem, com chave individual por modelo, caso e perfil autenticado ou visitante. O rascunho de visitante é compartilhado por visitantes do mesmo perfil de navegador. Limpar registro pede confirmação. Um registro inválido pode ser limpo individualmente. Uma falha de armazenamento aparece na interface. Trocar de rota descarta texto ainda não salvo.

O resumo conta apenas o status Avaliado como concluído. Em análise e Requer revisão continuam por concluir. Os status registram andamento humano. Uma futura persistência privada está descrita em [proposta SQL](proposta_avaliacoes_v1.sql). Antes de aplicá-la, validar privilégios, isolamento de duas contas, atualizações concorrentes, exclusão e regras para importar um rascunho com consentimento do usuário.

## Missão 14 — Persistência híbrida

O modo local permanece ativo por padrão. Sincronização, resolução de conflitos e importação têm testes no Marco A. O relatório indica a origem da avaliação. Consulte os limites da validação e o plano para uma ativação autorizada. [Relatório da Missão 14](RELATORIO_MISSAO_14.md)
