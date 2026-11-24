# Meus projetos 2.0

A carteira usa a rota #projetos. Cada registro abre #projetos/<UUID>. O dashboard e a carteira utilizam a mesma lista em memória. A Clínica ÁUREA aparece separadamente como demonstração, mesmo quando uma conta não tem projetos. Os estados distinguem visitante, configuração ausente, sessão em verificação, carregamento, erro, vazio e consulta sem resultados.

## Leitura e apresentação

project-data.js consulta projects com ID, nome, descrição, referência de modelo e datas reais. A consulta ordena por atualização e ID e percorre páginas de 200. A pesquisa local compara nome e descrição sem distinguir acentos ou maiúsculas. As quatro ordens usam datas ou o comparador pt-BR com desempate por ID. Os cartões e as linhas compartilham a mesma seleção e indicam contagem filtrada. A lista completa fica em memória durante a sessão. Para carteiras muito grandes será necessário medir custo e avaliar pesquisa no servidor.

Os detalhes mostram a descrição completa, UUID, datas, situação da referência de modelo e histórico lido sob demanda em páginas de 20. A presença de uma chave de modelo não comprova disponibilidade de visualização. As inspeções existentes pertencem à demonstração ÁUREA. Metadados privados não criam um modelo nem importam avaliações da clínica.

## Gravação

O formulário aceita título obrigatório até 120 caracteres e descrição até 2.000. Somente esses campos são enviados ao criar ou editar. Após resposta confirmada, a carteira recarrega os dados. Edição e exclusão filtram proprietário, ID e updated_at observado na abertura. Se outra aba alterou a revisão, a interface informa o conflito e preserva o formulário. Falha de transporte pode ocorrer depois de uma gravação aceita. Consulte a carteira antes de repetir uma criação. Não há fila de salvamento offline.

Excluir exige confirmação que nomeia o projeto e seu histórico. Cancelar recebe foco inicialmente. Os snapshots surgem dos gatilhos do banco, inclusive na criação. Uma atualização sem mudança efetiva não gera versão. A exclusão da linha pai remove o histórico em cascata.

## Roteiro de revisão

1. Abra [Meus projetos](http://127.0.0.1:4181/#projetos) e use o acesso à conta.
2. Entre com sua conta autorizada. Se desejar gravar no banco hospedado, crie um projeto próprio e recarregue a página.
3. Abra o cartão, confira descrição, UUID, datas e histórico. Edite a descrição, salve e confira a nova entrada.
4. Volte à carteira. Pesquise pelo nome, limpe a busca, alterne a ordem e compare grade e lista.
5. Abra a demonstração no bloco Clínica ÁUREA. Volte, saia da conta e entre novamente para rever seus projetos. A revisão da exclusão pode parar no botão Cancelar.
