# Integridade da Clínica ÁUREA

A referência é o inventário de 42 arquivos da Versão C. Para cada arquivo, o teste verifica o caminho, o número de bytes e o SHA-256. A linha de base e a verificação final coincidiram. A distribuição passou também a verificar o hash de cada cópia em `dist/clinica` durante o build. [Inventário com os hashes individuais](inventario-versao-c.json).

| Ativo | Resultado |
|---|---|
| Modelo | Sete segmentos, na ordem declarada no manifesto |
| Tamanho reconstruído | 113.018.368 bytes |
| SHA-256 do GLB | `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0` |
| Funcionalidade exercitada com o modelo | 21 ambientes, dez estados de risco, porta P03, colisor F060 e inspeção técnica R05 |
| Cópia de referência | `git diff b7af326 -- apps/viewer supabase/migrations` vazio |

A verificação do Studio relê os segmentos por HTTP, confere seu comprimento e hash e alimenta o digest do GLB em sequência. O HTML integrado e seu CSS ficam fora da árvore protegida. A identidade do modelo é estabelecida pelos bytes originais e pela regressão no navegador. [Resultado do Studio](evidencias-missao-16/integracao/studio.json).
