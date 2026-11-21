# Relatório de testes da Versão C

Executado em 21/11/2026 em Windows, Git 2.56.0, Node.js 24.22.3, Python 3.12, Chrome 157.0.8103.80 e Playwright 1.65.2. A aplicação foi servida via HTTP loopback de um diretório independente. O navegador foi executado sem janela visível. A segunda rodada usou aceleração de hardware AMD Radeon RX 580 e o perfil convencional Desempenho.

| Teste | Procedimento e evidência | Resultado | Limite |
|---|---|---|---|
| T01 Integridade e regressão dos arquivos | Comparar os hashes da fonte, backup e cópia com o manifesto ETAPA7.3. Reunir sete partes, conferir 113018368 bytes e SHA-256. Repetível com `tests/integridade.py` | APROVADO | Compara conteúdo e inventário, não todas as combinações de estado possíveis |
| T02 Instalação, sintaxe e referências | Confirmar estrutura estática, verificar sintaxe em 15 arquivos JS, imports, recursos HTML e JSON | APROVADO | Source map de depuração ausente e dispensável |
| T03 Inicialização e distribuição | Abrir painel via servidor local, entrar pelo iframe, aguardar a cena e observar a recepção renderizada. O navegador carregou os sete segmentos e o HDR sem HTTP >= 400 ou erro de console | APROVADO | Sem avaliação de performance de rede externa |
| T04 Movimento | Rodada inicial forçou SwiftShader e não observou deslocamento com pulsos curtos. Com renderização por hardware, clique em Avançar mudou X de 1,900 para 2,090 m, Parar estabilizou a posição, WASD e seta direita mudaram posição/rotação e o arrasto com mouse alterou a rotação | APROVADO na rodada por hardware | Rodada inicial REPROVADA no ambiente de renderização por software. A repetição também usou entradas de teclado mais longas. Pointer lock não verificado |
| T05 Motor, colisão, perfis e entrada | Repetir seis ensaios NullEngine em `tests/motor.mjs`. Inclui deadzone, mapeamentos, três escalas XR, passos em 30/72/90 atualizações, e deslocamento bloqueado pelo colisor F060 | APROVADO | Colisão testada em um obstáculo representativo, sem cobertura integral |
| T06 Porta | No runtime carregado, acionar a API de operação e atualizar a animação da DOOR_P03_PIVO. Fração foi de 0 para 1 | APROVADO | Ensaio de um registro via API interna. Operação por proximidade e outras 23 portas pendentes |
| T07 R01–R05 | Abrir cada aba pelo visualizador e alternar Proposta e Com problema. Nos cinco casos, conferir aria-pressed, estados CORR e PROB e criação dos marcadores no modelo. Cena da recepção e vista R05 capturadas para conferência local | APROVADO | Cobertura funcional das fichas e alternância. Revisão visual detalhada de todos os marcadores pendente |
| T08 Build | Distribuição estática pronta. Não existe comando de build | NÃO TESTÁVEL | Compilação não aplicável |
| T09 WebXR | Conferir perfis, entrada em duas etapas e gerenciamento de estados no código. Consulta desktop retornou false para immersive-vr | NÃO TESTÁVEL nesse navegador | Sessão, painel, analógicos, conforto, fluidez e laser PENDENTES em Quest 2 físico |

O resultado bruto da rodada de navegador está em [qa-chrome.json](qa-chrome.json). O ensaio inicial dependia de renderização por software e usava pulsos diferentes da segunda rodada. A diferença de resultado não foi atribuída a uma causa única. Os dados de tempo pertencem a esta máquina e não servem como referência de FPS no Quest.
