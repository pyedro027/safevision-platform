# Registro da importação

| Área | Antes | Depois | Revisão e reversão |
|---|---|---|---|
| Aplicação | Distribuição original em dist | Os 42 arquivos copiados para apps/viewer | Comparação por SHA-256. Reversível descartando a branch antes de integrar |
| Recursos | Sete segmentos GLB já preparados | Mesmos segmentos, registrados como Git binário | Hash de cada parte e do GLB recomposto |
| Configuração | Sem regras de checkout dedicadas | .gitattributes impede normalização de bytes em apps/viewer e .gitignore protege segredos, arquivos temporários e modelos de autoria | Revisar regras junto com a preparação #1 |
| Testes e documentação | Histórico de homologação local | Ensaio do motor adaptado aos caminhos do repositório, verificação de integridade e instruções | Revisão independente da aplicação |

Correções no código, na geometria ou nos parâmetros do tour: nenhuma. Os ajustes do ensaio mudam apenas os caminhos para localizar a aplicação e enviam o resultado ao console.
