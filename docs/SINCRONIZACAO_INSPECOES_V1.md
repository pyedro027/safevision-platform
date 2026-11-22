# Sincronização de inspeções

O build exige SAFEVISION_INSPECTION_SYNC=1 e endereço Supabase em loopback. O frontend repete a verificação de loopback. Por padrão o recurso fica desabilitado. Ativar um destino hospedado exige revisão deliberada das duas verificações e autorização específica.

Salvar na ficha escreve primeiro neste navegador. Abra Inspeções e selecione Sincronizar avaliações para recuperar registros próprios e enviar os pendentes. Sessão expirada, falha HTTP ou conexão indisponível deixam o rascunho pendente. É possível salvar offline com a ficha já carregada. A abertura inicial sem rede depende dos recursos que o navegador já possui.

Uma edição sincronizada retém o UUID da revisão baixada. O cliente filtra PATCH pela revisão esperada e a base gera um UUID novo. Na criação, a chave composta impede duplicatas. A comparação explícita interrompe a sincronização no primeiro conflito. A escolha confere novamente a revisão e preserva a versão substituída em uma lista no navegador, acessível na ficha. Retome a sincronização para os casos seguintes. A cópia preservada fica disponível para consulta e reaproveitamento manual dos textos.

O relatório indica a fonte de cada caso. As cópias confirmadas correspondem à última resposta validada, e a prévia informa quando é preciso sincronizar para verificar atualizações. Nenhuma chamada em segundo plano dispara apenas por abrir o relatório.
