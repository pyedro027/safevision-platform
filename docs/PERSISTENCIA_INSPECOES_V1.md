# Persistência de inspeções

O armazenamento usa chaves por identidade, modelo aurea-v03 e caso R01–R05. A leitura aceita o formato v1 com status, notes, advice e date, e dá precedência a v2. A leitura e o salvamento v2 preservam v1. Limpar é uma operação explícita, com confirmação, e afeta o registro ativo no navegador. A cópia na nuvem pode reaparecer numa consulta posterior. DELETE remoto existe no esquema e foi testado em PostgreSQL, mas não é oferecido na interface.

O contrato lógico usa versão de modelo e código no endereço, status, observações, recomendação, data, data de criação quando conhecida, revisão e estado pendente. Fichas oficiais continuam nos cinco JSON do visualizador. Uma cópia confirmada armazena os metadados de data e revisão devolvidos pelo servidor.

As chaves de visitante são independentes das contas. Para importar, abra a seção de rascunhos de visitante, consulte códigos e datas, selecione e confirme. A importação cria cópias pendentes no escopo da conta e mantém os originais. Se já houver rascunho ativo na conta para um dos casos, a importação para e preserva os dados para revisão. Com acesso remoto habilitado, a consulta explícita sinaliza quais casos já existem na nuvem antes da seleção. O armazenamento do navegador fica acessível a quem controla o perfil local.
