# Prévia Vercel

A configuração versionada usa a raiz do repositório com saída `apps/viewer`. É um pacote estático. O painel, o iframe `WEB/index.html` e `MODELO/` devem compartilhar a mesma origem HTTPS.

O total da distribuição é 126.038.659 bytes. Cada segmento tem até 16 MiB. A cota de upload estático da CLI Hobby é de 100 MB para o conjunto. A primeira opção é uma prévia a partir do Git, apontando para o commit de integração e verificando a adequação do plano antes de iniciar. A alternativa é avaliar armazenamento HTTPS de segmentos com CORS, custos e integridade verificados antes de mudar a distribuição.

O conector retornou 403 para o escopo `pyedros-projects` durante a inspeção inicial. A autorização da equipe precisa ser concluída antes de escolher projeto, apurar plano e iniciar uma prévia. URL, ID de deploy e testes HTTPS ainda pendentes.

Na prévia, conferir respostas HTTP e SHA-256 de todos os segmentos, MIME das páginas e módulos, carregamento integral da cena, controles, navegação, porta representativa e R01–R05. Verificar `isSecureContext`, disponibilidade de `navigator.xr` e permissão no iframe. O comportamento físico depende de teste no Quest 2. A configuração `_headers` faz parte da distribuição original. Conferir os cabeçalhos efetivamente servidos antes de declarar sua aplicação.

- [Configuração estática](https://vercel.com/docs/project-configuration/vercel-json)
- [Limites da Vercel](https://vercel.com/docs/limits)
