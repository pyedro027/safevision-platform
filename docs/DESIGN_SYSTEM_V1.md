# Interface da plataforma V1

A navegação organiza Plataforma, Exploração e Sistema. Em telas de até 810 px, o botão Menu controla a navegação com aria-expanded, aceita Enter e retorna o foco ao fechar com Escape. A rota atual usa aria-current e aparece no cabeçalho.

## Tokens e componentes

| Uso | Regra |
|---|---|
| Base | Verde profundo #133c33, tinta #172c27, papel #f3f3ed e superfícies brancas |
| Ação | Verde #205849 em botões primários, verde claro #d7e9a8 sobre superfícies escuras |
| Identificação técnica | Cobre #87502c e fonte monoespaçada para códigos e medidas |
| Tipografia | Segoe UI nos controles, Georgia nos títulos editoriais da clínica, Consolas nos indicadores |
| Geometria | Raio principal de 12 px, bordas #cdd5c9, espaçamento fluido de 18 a 34 px |
| Hierarquia | Imagem de arquitetura para o projeto em destaque, faixa de indicadores para dados do modelo, listas para registros privados, fichas ilustradas para riscos |
| Formulários | Labels explícitos, foco visível, validação nativa, botão ocupado durante a operação e região de feedback |
| Estados | Visitante, execução sem integração, sessão autenticada, consulta em andamento, falha e lista vazia usam o estado existente da aplicação |
| Movimento | Transições discretas e preferência de movimento reduzido respeitada |

Os estilos compartilhados estão em apps/platform/design.css, sobre a base platform.css e studio/studio.css. Os renders em media são derivados das imagens finais do projeto V03. Todos os componentes funcionam sem fontes remotas ou bibliotecas visuais adicionais.
