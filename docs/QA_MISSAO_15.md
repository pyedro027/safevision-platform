# QA da Missão 15

## Linha de base

A execução começou em bf97064, com working tree limpo e refs remotas conferidas. Passaram o build estático, integridade, motor, isolamento SQL das duas migrações em bases locais, navegador da plataforma, seis rotas em seis larguras e Studio com os dois PDFs oficiais. Na primeira execução simultânea o teste de inspeção excedeu cinco segundos esperando o dashboard inicial. A repetição individual, ainda sobre a distribuição original, passou. O teste posterior voltou a produzir o PDF A4 de seis páginas.

Na auditoria de código, a carteira se limitava à listagem, o histórico abria em diálogo e a leitura de dados não distinguia duas requisições concorrentes da mesma conta. A tela de recuperação mostrava o formulário para uma sessão comum com o parâmetro na URL. A Missão 15 cobre esses pontos com rota própria, token de identidade por operação, invalidação de respostas, revisão observada e autorização do fluxo de recuperação por evento.

## Resultados reproduzíveis

| Suíte | Exercício e ambiente |
| --- | --- |
| tests/platform_browser.py | SDK vendorizado, Chrome e HTTP simulado. PKCE com verificador de cadastro e recuperação, link em navegador errado, senha inválida, login, logout, perfil, CRUD, histórico e regressões da sincronização de inspeções. |
| tests/accounts_projects_browser.py | Chrome e HTTP simulado. Duas contas de fixture, retorno interno após login, grade/lista, pesquisa por acento, ordenação de nomes, formulários, submissão duplicada durante gravação lenta, conflito de revisão, conteúdo preservado na falha, nova aba, restauração e falha de refresh, histórico atrasado durante troca de conta, 401/403/404/429/500/503, foco e seis larguras. |
| tests/rls.mjs | PostgreSQL/PGlite. Fundação aplicada em memória, A/B e anon, snapshots, alterações sem mudança, campos protegidos, leitura, criação, edição, exclusão e cascata. |
| tests/inspection_sync.mjs | PostgreSQL/PGlite e adaptador de transporte simulado. Estado da Missão 14 continua isolado. |
| tests/redesign_browser.py | Chrome, seis rotas por seis larguras, menu mobile, Enter, Escape e foco. |
| tests/inspection_browser.py | Chrome. R01–R05, texto seguro, edição, persistência local e A4 de seis páginas. |
| tests/studio_browser.py | PDFs oficiais, falha/retentativa, uma cena por vez, sete segmentos, estados dos cinco casos e zero erros de página ou console. |
| tests/motor.mjs e tests/integridade.py | Seis verificações do motor e hashes dos 42 arquivos. GLB recomposto em memória com 113018368 bytes. |

A interface privada carrega metadados. O teste verifica ausência de requisições ao diretório do modelo ao criar projeto. Busca, ordenação e alternância de layout usam dados já carregados. A missão não produziu benchmark de carteiras em escala comercial. A nova carteira foi inspecionada em Chrome 158 nas larguras 375, 430, 768, 1024, 1440 e 1920 px. A navegação por teclado incluiu retorno ao acionador ao fechar o diálogo, cancelamento da exclusão em foco e visibilidade de senha. Leitor de tela, e-mail real, Quest físico e aceite estético do proprietário seguem pendentes.

## Reprodução

Na raiz do repositório, execute `node scripts/build-platform.mjs` **sem variáveis de Supabase para a regressão isolada**. Sirva dist em loopback com `python -m http.server 4181 --bind 127.0.0.1 --directory dist`. Esse build limpa a configuração de revisão local, que pode ser regenerada informando o par público SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY ao build. Deixe SAFEVISION_INSPECTION_SYNC desligada.

Use Python com Playwright e pypdf, Chrome instalado, Node e PGlite 0.5.17:

~~~text
node tests/rls.mjs ../safevision-platform-tools/pglite/package/dist/index.js
node tests/inspection_sync.mjs ../safevision-platform-tools/pglite/package/dist/index.js
node tests/motor.mjs
python tests/integridade.py
python tests/platform_browser.py
python tests/accounts_projects_browser.py
python tests/inspection_browser.py http://127.0.0.1:4181 <pasta-qa> --chrome <chrome.exe>
python tests/redesign_browser.py http://127.0.0.1:4181 <pasta-qa> --chrome <chrome.exe>
python tests/studio_browser.py <pasta-dos-dois-pdfs> <pasta-qa> --chrome <chrome.exe>
~~~

Defina CHROME_PATH para o teste de carteira. M15_EVIDENCE pode direcionar as capturas de uma repetição para fora do repositório. Os testes com fixture rodam em servidor próprio de loopback e não fazem cadastro remoto. [Manifesto das 30 capturas](evidencias-missao-15/manifesto.json) · [Matriz de aceitação](qa-missao-15.json).

## Revisão visual da Missão 15

As capturas 01–06 mostram o formulário, a imagem da recepção já existente, estados e perfil. A hierarquia mantém o título da rota, campos com label e ação de envio destacada. Na revisão das imagens, o botão Mostrar precisava de largura própria para evitar quebra de palavra. A alteração foi incorporada antes das capturas finais. A arte complementar é removida em telas estreitas.

As capturas 07–13 e 23 mostram a carteira, cartões, linhas, busca e contagem. A grade distribui os cartões pela largura disponível, o nome leva aos detalhes e a descrição ocupa até duas linhas. Datas e filtros continuam acessíveis na lista. Os registros das imagens pertencem à fixture. A clínica tem imagem própria e fica fora da contagem. A captura 25 mostra essa separação.

As capturas 14–22 e 24 mostram criação, confirmação, detalhes, histórico, conflito potencial de exclusão e falha de leitura. Os detalhes apresentam o UUID integral e a descrição sem truncamento. A exclusão dá foco inicial a Cancelar. Histórico e ausência de modelo têm regiões distintas. As imagens 26–30 registram as rotas da demonstração. O fluxo está disponível para avaliação pelo proprietário.
