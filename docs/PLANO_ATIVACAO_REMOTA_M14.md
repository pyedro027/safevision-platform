# Plano para o Marco B

Destino solicitado para uma futura autorização: safevision3d, qltabckpluhxnskxgofx, us-east-1. Migração proposta: 20261122003740_inspection_reviews_v1.sql. Ela cria a tabela, a chave composta, as restrições, a política por proprietário, os grants e a função e o gatilho privados de atualização. As tabelas existentes ficam fora do escopo do DDL.

1. Autorizar explicitamente a aplicação da migração, a exposição na Data API e a homologação controlada com as identidades permitidas.
2. Antes de aplicar, guardar a configuração e confirmar histórico, grants, exposição de schema e estratégia de backup. Validar a stack isolada com JWTs reais de duas contas. Revisar o dry run e conferir o identificador do destino.
3. Aplicar somente a nova migração. Verificar catálogo, negação anônima, propriedade, concorrência, acesso cruzado e logout no contexto de teste. Confirmar que os três recursos existentes continuam acessíveis conforme as permissões atuais.
4. Revisar separadamente os gates de loopback em build e runtime. Habilitar um único ambiente autorizado somente após a confirmação do banco. Publicação é uma decisão posterior.
5. Se houver falha de uso após aplicar, desabilitar o recurso no frontend, preservar rascunhos e avaliações já gravadas, inspecionar grants e logs e preparar correção aditiva. A transação protege contra aplicação parcial. Uma reversão de banco exige autorização e preservação prévia dos dados.

Riscos a homologar incluem exposição Data API, comportamento JWT real e limites de armazenamento local. A aplicação da migração por si só não habilita sincronização hospedada.
