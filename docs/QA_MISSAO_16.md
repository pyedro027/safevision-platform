# QA da Demonstration Edition · 24/11/2026

A linha de base em `b7af326` passou nas nove suítes. Na distribuição integrada, voltaram a passar integridade, motor, RLS, sincronização isolada, contas e projetos, plataforma, redesign, inspeções e Studio. Duas suítes adicionais cobrem o visualizador e a apresentação. As primeiras regressões executaram em Chrome 158.0.8127.37. A revisão final do tour, Studio e roteiro executou em Chrome 159.0.8154.33. Node v24.22.3, Python, Playwright e pypdf no PC de QA.

| Verificação | Evidência |
|---|---|
| R01–R05 em problema e proposta, 21 ambientes, pausa, ajuda, configurações, arquitetura limpa, pointer lock e tela cheia | [Resultado do visualizador](evidencias-missao-16/visualizador/result.json) |
| Uso de sete segmentos, porta P03, colisor F060, dois PDFs oficiais, cancelamento, retentativa e reutilização | [Studio](evidencias-missao-16/integracao/studio.json) |
| Retorno com observação pendente, cancelar a saída e confirmar descarte | [Ficha retomada](evidencias-missao-16/visualizador/retorno-rascunho.jpg) |
| Impressão real do relatório, conferida em seis páginas A4 | [PDF gerado](evidencias-missao-16/integracao/relatorio-exemplo.pdf) |
| Dez etapas, recarga, retorno, encerramento, reinício e sessão de QA | [Apresentação](evidencias-missao-16/apresentacao/result.json) |
| Contas, histórico, erros de rede e mensagens | SDK distribuído e serviços HTTP simulados em loopback, suítes accounts_projects_browser e platform_browser |
| Isolamento entre usuários e sincronização experimental | Testes em PGlite com identidades separadas. Operações restritas ao ambiente de teste |
| Responsividade e teclado | Larguras 375, 430, 768, 1024, 1440 e 1920 px, além de paisagem 844 × 390 no tour. Roteiro, foco, teclas e prevenção de rolagem horizontal conferidos |
| Inventário e correspondente cópia em dist | [Integridade](INTEGRIDADE_VISUALIZADOR_M16.md) |

## Correções encontradas pelo QA

O Studio podia abrir a exploração com a pausa cobrindo o botão inicial. A sessão preparada agora suspende o renderizador sem abrir a pausa. Em tela estreita, marcadores projetados fora do quadro ampliavam a largura interna. O recorte da camada dos marcadores e o ajuste da grade resolveram a regressão. Uma cópia em dist mostrou bytes divergentes após interrupção do ambiente. O build reconstruiu a distribuição a partir da origem íntegra e passou a validar cada arquivo distribuído. O teste de descarte de texto passou a aguardar o evento real do diálogo antes de verificar a navegação.

As capturas internas mostram a ficha R05 sobre a cena, o painel de entrada sobre a imagem da recepção e o roteiro de casos. Em 375 px, a ficha ocupa grande parte do quadro. Fechá-la libera a área para explorar. A lista de ambientes e a pausa continuam sendo controles do motor original, com apresentação adaptada.

## Reproduzir

Com Node e Python instalados, construa com `node scripts/build-platform.mjs` e sirva com `python scripts/servir-demonstracao.py`. O servidor atende apenas a máquina local. A execução visitante usa configuração vazia. Para a carteira do titular, use o par autorizado de URL e chave pública na geração do build. O build substitui dist, inclusive sua configuração. Preserve antes a configuração local funcional.

Com Playwright e pypdf disponíveis, execute `python tests/unified_viewer_browser.py` e `python tests/presentation_browser.py`. O parâmetro de ambiente CHROME_PATH permite selecionar o executável local. M16_EVIDENCE direciona as novas capturas a uma pasta de revisão separada. Ambas as suítes atendem a configuração visitante em loopback. A apresentação autenticada usa o SDK com uma resposta sintética.

As regressões históricas que esperam configuração vazia devem rodar em uma distribuição visitante. Use `python tests/integridade.py`, `node tests/motor.mjs`, `node tests/rls.mjs <módulo-PGlite>` e `node tests/inspection_sync.mjs <módulo-PGlite>`. Os scripts de conta e plataforma são `tests/accounts_projects_browser.py` e `tests/platform_browser.py`. As suítes redesign_browser e inspection_browser recebem origem local, diretório de evidências e --chrome. A suíte studio_browser recebe a pasta dos PDFs oficiais, a pasta de saída e --chrome.

A homologação física em Quest 2, a confirmação de e-mails remotos e a certificação de acessibilidade permanecem fora dos resultados desta rodada. O tempo máximo de inicialização foi conferido no código. O teste induziu falha recuperável de rede. [Matriz de 110 critérios](qa-missao-16.json).

Na conferência final, Chrome 159 também foi aberto com janela no endereço de revisão. O roteiro e a tela de login da configuração integrada foram exibidos. Nenhuma credencial foi inserida.
