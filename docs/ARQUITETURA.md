# Arquitetura da Versão C

Aplicação estática em HTML, CSS e JavaScript ES Modules. O Babylon.js 9.30.0 e o carregador glTF são distribuídos em `apps/viewer/WEB/vendor`. A cópia não depende de instalação npm, build, banco de dados ou backend. O Babylon é empacotado localmente. O runtime pode consultar perfis de entrada WebXR, e as fichas têm links bibliográficos externos.

| Caminho em `apps/viewer` | Papel |
|---|---|
| `index.html`, `app.js`, `app.css` | Painel documental e iframe de mesma origem com permissão para rastreamento XR |
| `WEB/index.html`, `WEB/tour.js` | Entrada do visualizador, luzes, renderização e inicialização |
| `WEB/modules/model.js` | Busca e validação dos segmentos, importação GLB, grupos, colisores e portas |
| `WEB/modules/navigation.js`, `presentation-controls.js`, `input-math.js` | Movimento com o elipsoide Babylon, teclado, mouse, controles na tela e leitura condicionada de gamepad |
| `WEB/modules/inspection.js`, `interface.js`, `r05-technical.js` | Marcadores, fichas, comparação e recorte técnico do R05 |
| `WEB/modules/bridge.js`, `xr.js`, `quality.js` | Comunicação painel–tour, entrada e saída imersivas, painel VR, perfis gráficos e controles |
| `MODELO`, `WEB/data/fichas` | Navegação, manifestos, modelo segmentado e dados documentais |

O visualizador valida SHA-256 de cada segmento e reúne os bytes em um Blob GLB temporário. O manifesto, os segmentos, as fichas e o HDR usam caminhos relativos. Os estados PROB e CORR ligam e desligam grupos e colisores associados. A edição futura da geometria deve ocorrer em uma cópia do Blender e ter revisão explícita de navegação e dos cinco riscos.

O PR de preparação #1 descreve uma arquitetura futura. A importação parte de main e registra a arquitetura existente em paralelo. Antes de combinar os PRs, conciliar README, .gitignore, ARQUITETURA, ROADMAP e IMPORTAR_VERSAO_C em revisão própria.

## Direção da Platform V1

O planejamento do PR #1 separa portal, identidade, projetos e arquivos privados. O visualizador continua como módulo estático. Auth, autorização por proprietário e Storage privado serão desenvolvidos em ambiente de desenvolvimento. A prévia deve ficar separada da publicação estável da C.
