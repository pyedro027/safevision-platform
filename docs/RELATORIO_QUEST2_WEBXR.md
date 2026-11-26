# SAFEVISION — Relatório de correção do Quest 2

25 de novembro de 2026 · Clínica ÁUREA V03 · SAFEVISION Platform V1.0.0-DEMO

**Correção implementada — aguardando homologação física.**

**Endereço para o Meta Quest Browser**

[Abrir a Clínica ÁUREA no Quest 2](https://safevision-quest2.vercel.app/vr/index.html)

## A. Histórico recuperado

O tour convencional arquivado em `TOUR_SAFEVISION_V03/WEB` precede a entrada XR modular. Os pacotes `SOFTWARE_SAFEVISION_V03/PUBLICAR` e `HOMOLOGACAO_QUEST2_ETAPA7_20261116/01_IMPLANTACAO/dist` guardam a implementação XR mais antiga analisada. Os dois têm o mesmo módulo XR, SHA-256 `4535d7cbac85541768ce56777ed782a9d54bc115dae5c37951f795e12d28c9cd`. A versão aprimorada de 16/11 tem uma segunda revisão do módulo. A Etapa 7.3 e a Etapa 7.4 de 20/11 contêm a Versão C, cujo módulo XR é idêntico ao publicado na plataforma, SHA-256 `7804bed4db583246d82f71a32c3270fb5d45084495a9064575c0d3de37aeccb6`. As cópias históricas foram lidas e preservadas.

O titular relatou um teste físico bem-sucedido antes da integração. A documentação arquivada não associa essa sessão a um SHA ou pacote inequívoco. O ensaio A usa o pacote XR mais antigo recuperado como aproximação histórica identificada.

A importação `f5edac1` é o único commit que alterou o visualizador original em `apps/viewer/WEB`. A integração evoluiu por `303240a` (dashboard), `78a5054` (Studio), `593757f` (inspeções e sincronização), `bac0ae6` (rota de exploração e visualizador integrado) e `f4ac198` (captura do mouse e isolamento do QA). A publicação oficial continua fixada em `0084398b4f55948d2c731c2eb88fd7fc57eebc22` no deploy `dpl_GMNshJsxQSfVrfuXHdneEgMui9RC`.

## B. Diferenças identificadas

| Componente | Arquivos XR anteriores à integração | Versão C e plataforma publicada |
|---|---|---|
| HTML, origem e build | Documento direto `WEB/index.html`, servido por HTTP local ou HTTPS estático | A entrada original continua acessível diretamente. O build também deriva `visualizador.html`; Studio e exploração o montam em iframe de mesma origem com `xr-spatial-tracking` e fullscreen |
| Motor, ativos e iluminação | Babylon.js 9.30.0 local. O manifesto do modelo nos pacotes históricos de homologação utiliza a mesma reconstrução do GLB | Babylon.js 9.30.0 com o mesmo binário. O GLB, os materiais, as texturas, a iluminação e as cinco comparações continuam nos recursos originais |
| Câmera, WebGL e estéreo | Câmera convencional em primeira pessoa e troca Babylon para XR `local-floor`; perfil inicial de escala 0,65 | A entrada mantém a troca e o espaço de referência. O perfil inicial da Versão C pede 0,85 com antialiasing. O contexto do visualizador original desabilita a recuperação automática de perda |
| Colisão, spawn e navegação | Locomoção de primeira pessoa, colisores, posição de início e módulo XR em desenvolvimento | Os sete segmentos e o mapa de navegação ficam na árvore original. A Versão C associa a locomoção ao modo Passear e ao reconhecimento simultâneo dos dois controles |
| Entrada, foco, visibilidade e suspensão | Ativação pelo visualizador, controle de foco local. A árvore mais antiga recuperada já contém uma guarda de suspensão | O integrado adiciona rodada de mensagens `pause/resume/vr`, espera do iframe, foco e remoção do iframe pelo painel. A guarda continua respeitando `suspended` até durante a sessão XR |
| Contexto HTTPS | Publicações estáticas históricas, sem evidência de qual URL foi usada no teste físico | Domínio da plataforma na Vercel. Chamadas relativas e permissões do iframe são controladas pela plataforma |
| Entrada dedicada | — | O candidato usa documento de primeiro nível, gesto direto, framebuffer de perfil 0,65 sem MSAA e recursos originais compartilhados. `Permissions-Policy: xr-spatial-tracking=(self)` está presente no endereço de homologação |

## C. Causa e grau de confirmação

Os ensaios A–D entraram em sessão, configuraram duas câmeras de olho e depois registraram **zero frames da cena** durante a suspensão induzida. O valor `suspended` interdita `scene.render()` mesmo com sessão XR aberta. A plataforma atual pode atribuir esse estado à preparação do iframe, além de transmitir suspensão e retomada pelo bridge. A guarda já existia na cópia histórica. A investigação identificou a falha determinística e o caminho que pode dispará-la durante a integração. A sequência exata que produziu a tela preta no Quest real ainda não foi capturada.

O caso E renderizou com o mesmo Babylon.js uma cena mínima, com piso, cubo e dois controles. O caso F renderizou a ÁUREA completa com o novo ciclo. Sob a suspensão e a visibilidade induzidas que interromperam B–D, F continuou a submeter frames da cena. WebGL, GPU e visibilidade do compositor físico continuam hipóteses se o problema reaparecer. Não houve evidência para trocar o motor ou reduzir a geometria.

## D. Correção

| Arquivo | Alteração |
|---|---|
| `apps/quest/session.js` | Controla estados XR, preparação, câmera, restauração do ciclo 2D, monitoramento de frames e diagnóstico local limitado |
| `apps/quest/quest.css` | Apresenta entrada VR, estado, diagnóstico, retorno e controles em tela |
| `scripts/build-quest.mjs` | Deriva entrada, ciclo e módulo XR a partir dos originais protegidos; valida a presença dos trechos de origem |
| `scripts/build-platform.mjs` | Reutiliza os 42 arquivos verificados. O modo isolado empacota somente a clínica, sua entrada e os estilos |
| `vercel.json` | Define permissões XR para os recursos da rota e impede deploy automático da branch de hotfix no projeto oficial |
| `tests/quest_browser.py` | Executa seis ensaios diferenciais e QA da entrada pública com emulação Quest 2 |

## E. WebXR

A entrada prepara o suporte antes de habilitar **Entrar em VR**. O clique chama `enterXRAsync('immersive-vr','local-floor',xr.renderTarget)` na mesma ação do usuário. O Babylon gerencia a troca de câmera, a XRSession, o framebuffer, o scheduler e a volta ao ciclo convencional. O controlador impede entradas concorrentes e libera observadores e temporizadores na saída. A guarda de 2D deixa de suspender os frames durante a entrada, a sessão ou o encerramento. A posição observada da câmera na recepção foi aproximadamente `[1,90; 1,60; -5,00]` em coordenadas Babylon e os planos de corte foram 0,055 m e 100 m.

No candidato HTTPS, o primeiro frame da cena teve pose válida, duas câmeras de olho, dois viewports de 620 × 860 e 381 malhas ativas, com o perfil emulado e o canvas do teste. O diagnóstico registra criação da sessão, primeiro callback, primeiro frame efetivamente processado, perfil, câmera, visibilidade, contexto WebGL e controles. Uma falha do render ou a ausência prolongada de frames dispara encerramento controlado. A interface também explica como retornar pelo botão Meta se a sessão continuar no navegador. Os eventos ficam na origem local do candidato, com limite de 96 e cópia manual. O candidato não transmite o diagnóstico.

## F. Controles

No modo de tela há botões de avanço, recuo, deslocamento lateral, giro e parada, acionáveis pelo ponteiro e gatilho. O QA movimentou a câmera com esses botões. O acesso aos analógicos Touch fora de uma sessão XR pode pertencer ao sistema do headset.

Em VR, o analógico esquerdo move e o direito aplica giro de 30°. Cada controle se habilita quando passa pela posição neutra e o motor usa a colisão elipsoidal existente, com velocidade de até 1,35 m/s. O grip abriu o painel de ambientes, riscos, portas e saída no ensaio hospedado. O painel existente continua associado a R01–R05, suas fichas e os estados problema e proposta. A cabeça acompanha a pose XR e a rotação física simulada foi testada independentemente do giro por controle.

## G. Performance

O GLB tem 113.018.368 bytes e 2.330.138 triângulos calculados dos acessores das primitivas, incluindo as instâncias de malha declaradas nos nós. A cena contou 2.377.764 vértices, 823 meshes incluindo auxiliares e colisores, 44 materiais, oito texturas e 23 luzes. A escala XR solicitada de 0,65, o framebuffer sem MSAA e o perfil convencional Desempenho são restritos à entrada dedicada. O controlador de qualidade mantém as sombras desligadas e a cena sem passes de pós-processamento adicionais. Os números do emulador não sustentam inferências sobre memória GPU, draw calls por olho, FPS sustentado, temperatura ou conforto do Quest 2 real. [Perfil anterior](PERFORMANCE_M16.md).

## H. Testes

| Ensaio ou suíte | Método | Evidência |
|---|---|---|
| A · histórico recuperado | Chrome e Meta IWER em loopback | Dois olhos, zero frames da cena com suspensão induzida |
| B · distribuição original atual | Mesmo navegador e emulador, documento direto | Dois olhos, zero frames da cena com suspensão induzida |
| C · derivado atual | Mesmo navegador e emulador, entrada derivada direta | Dois olhos, zero frames da cena com suspensão induzida |
| D · integração atual | Rota de exploração, iframe e bridge | Dois olhos, zero frames da cena com suspensão induzida |
| E · cena mínima | Babylon 9.30.0, piso, cubo e iluminação | Dois olhos, WebGL XR layer e ambos os controles |
| F · clínica dedicada | Mesmo GLB, Chrome 159.0.8154.33 e Meta IWER 2.8.0 | Estéreo com malhas, rastreamento, dois analógicos, saída, reentrada, recusa de permissão e exceção do render recuperadas |
| Desktop | Suítes de integridade, motor, RLS local, sincronização local, dashboard, contas simuladas, visualizador, Studio, apresentação, inspeções/PDF e layout responsivo | Modelo real, sete segmentos, 21 ambientes, dez estados, porta P03, colisor F060, PDF A4 e dez passos da apresentação. Nenhuma gravação em serviços remotos |
| HTTPS | Emulação carregada pela página publicada, acesso anônimo e reconstrução dos segmentos transferidos do servidor | HTTP 200, contexto seguro, permissão XR, 65–66 frames em testes de 650 ms com suspensão induzida. Três sessões, painel pelo grip, diagnóstico recuperado após recarga e navegação em tela móvel sem WebXR |
| Dispositivo físico | Meta Quest 2 do titular | Pendente nesta versão |

A emulação valida a sessão, a câmera e a renderização de cena por olho. A imagem efetivamente exibida pelo compositor físico, os controles fora da sessão nativa e a estabilidade sob carga no headset serão verificados na mesma tentativa. [Matriz dos 50 critérios](qa-quest2.json) · [Diagnóstico de QA em HTTPS](evidencias-quest2/webxr-https.json).

Referências técnicas consultadas em 25/11/2026. A sequência de sessão/câmera foi verificada no código do Babylon correspondente ao binário. Perfis e eixos seguem a extensão de controles WebXR. [Babylon WebXR Experience Helper 9.30.0](https://github.com/BabylonJS/Babylon.js/blob/9.30.0/packages/dev/core/src/XR/webXRExperienceHelper.ts) · [Babylon WebXR Session Manager 9.30.0](https://github.com/BabylonJS/Babylon.js/blob/9.30.0/packages/dev/core/src/XR/webXRSessionManager.ts) · [WebXR Gamepads Module](https://www.w3.org/TR/webxr-gamepads-module-1/) · [Meta WebXR](https://developers.meta.com/vr/documentation/web/webxr-workflow/) · [Meta IWER](https://github.com/meta-quest/immersive-web-emulation-runtime).

## I. Integridade

42/42 arquivos iguais ao inventário, localmente e transferidos anonimamente de `/clinica/` no candidato. A recomposição dos sete segmentos na ordem do manifesto tem **113.018.368 bytes**, SHA-256 `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. O diff contra o commit oficial está vazio para `apps/viewer`, `apps/platform` e `supabase`. A implantação isolada retorna 404 para `/config.json`, `/platform.js` e `/vendor/supabase.js`. O Supabase e a Missão 14B ficaram fora da operação. [Integridade HTTPS](evidencias-quest2/integridade-https.json).

## J. Entrega

Somente um endereço precisa ser aberto no Quest Browser. Aguarde **Entrar em VR**, clique, veja se a clínica aparece, olhe ao redor, caminhe com o analógico esquerdo, gire com o direito e saia pelo botão Meta. O grip abre o menu durante a sessão. Se houver tela preta, volte pelo botão Meta e abra **Diagnóstico → Copiar diagnóstico** na mesma página. Se precisar recarregar, a tentativa anterior estará na seção de diagnóstico. [Abrir a Clínica ÁUREA no Quest 2](https://safevision-quest2.vercel.app/vr/index.html).

Projeto Vercel dedicado `safevision-quest2`, deploy `dpl_CcgXJRrDPs6MesacX4ibE7Rr4bBc`, commit `3836a7cf6f52e0ceea7ade08618d1d0b5fcc48d4`. O endereço é público e independe do computador local. A branch é `hotfix/quest2-webxr` e o [PR #14](https://github.com/pyedro027/safevision-platform/pull/14) fica em rascunho até revisão.

## K. Continuidade

Use o endereço único e registre o teste físico. Em caso de falha, compare o registro copiado com o diagnóstico hospedado e identifique o último evento entre entrada, sessão, primeiro callback, primeiro render, visibilidade e controlador. Assim é possível distinguir perda de render da cena de falha do compositor ou do contexto. Se o teste físico for aprovado, confira novamente a produção original, finalize o PR, rode a regressão da versão escolhida e faça a promoção ao domínio oficial mediante aprovação. Preserve o deployment de referência como ponto de retorno.

Para reproduzir localmente, gere `dist/` com `node scripts/build-platform.mjs` e execute `python tests/quest_browser.py` com Playwright, `CHROME_PATH`, `SAFEVISION_IWER` apontando para o bundle 2.8.0 e `SAFEVISION_QUEST_QA` para a pasta de resultados. `SAFEVISION_QUEST_ARCHIVE` inclui o ensaio A. `SAFEVISION_QUEST_HOST` aponta ao candidato HTTPS para o ensaio F remoto. A cena mínima e o runtime de emulação existem somente no teste.
