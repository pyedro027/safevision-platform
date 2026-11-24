# Preparação do visualizador para a Missão 16

O acesso direto ao tour ainda apresenta o shell antigo. Na Missão 15 a página privada aponta para a demonstração por #aurea, sem associar modelos privados à clínica.

| Origem | Destino atual | Natureza e ação futura |
| --- | --- | --- |
| Dashboard e página Clínica ÁUREA em workspace.js | ./clinica/ | Acesso público à interface histórica. Encaminhar à futura rota integrada. |
| Cinco fichas em workspace.js | ./clinica/#inspection/R01 até R05 | Preservar o caso e a origem ao abrir o shell. |
| Resumo de inspeção em inspection.js | ./clinica/ | Integrar com retorno às inspeções. |
| Studio e detalhe de inspeção | loadClinic em studio/clinic-session.js | Reutilizar iframe e contrato de ciclo de vida. |
| Adaptador do Studio | ./clinica/WEB/index.html | Documento do iframe, concedendo fullscreen e xr-spatial-tracking. |
| Manifesto, partes do GLB, imagens e fichas | ./clinica/MODELO/, ./clinica/assets/ e ./clinica/WEB/data/fichas/ | Recursos técnicos com localização preservada. |

## Contrato

O canal postMessage chama-se safevision. O host e o iframe verificam origin e source. O viewer sinaliza ready, home e vr-status. Os comandos existentes incluem pause, resume, risk com código, settings e vr. O adaptador acompanha loadMessage via observador e timeout de 210 segundos, interrompe observadores/listeners e remove o iframe no descarte. Ao receber ready, estaciona o render com __tourDebug.suspended. Essa dependência interna e a leitura do DOM exigem mesma origem e validação na próxima etapa.

Proposta para revisão futura: uma rota #explorar/<caso opcional> com origem interna controlada, toolbar com retorno, caso, estados, tela cheia e acesso VR. Manter uma única cena, pausar ao cobrir, liberar ao sair, transportar o contexto das inspeções e preservar o Studio. A ativação XR exige gesto do usuário, HTTPS ou ambiente seguro suportado e teste físico. O shell externo não deve prometer controlar todos os elementos internos. Mudanças no viewer original, bridge ou GLB requerem autorização específica e regressão dos 42 arquivos.

## Sequência demonstrativa

Dashboard → Conta → carteira → projeto → histórico → Clínica ÁUREA → Studio → modelo → R01–R05 → avaliação humana → relatório → retorno. Os pontos de atrito são a troca de identidade visual no tour direto, múltiplos caminhos para o 3D, o custo de carregar sete partes e o retorno ao contexto correto. A Missão 16 deverá validar a sequência com um projeto real autorizado, testar o retorno e o ciclo de vida em desktop/mobile e homologar conforto e comandos no Quest 2. O modo de apresentação e a publicação permanecem etapas futuras.
