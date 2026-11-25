# Visualizador integrado da Clínica ÁUREA

A plataforma abre a clínica dentro da área de trabalho. O mesmo componente de comandos acompanha a exploração direta e a sessão preparada pelo Studio. A entrada exibe a recepção original da clínica. O cabeçalho interno identifica o ambiente atual e dá acesso aos ambientes, riscos, modo limpo e pausa.

O build verifica o inventário SHA-256 e copia o tour para `dist/clinica`. Gera `visualizador.html` a partir do HTML original, mantendo a base dos recursos em `clinica/WEB/`. A folha `viewer-interior.css` aplica a identidade da plataforma aos controles existentes. O pequeno módulo `viewer-controls.js` lê a aba de risco selecionada e abre a avaliação correspondente no documento pai.

## Contrato e ciclo de vida

`clinic-session.js` valida o manifesto, cria um iframe da mesma origem e aceita eventos apenas daquela janela e origem. O canal `safevision` transporta os comandos `risk`, `pause`, `resume` e `vr` e os eventos `ready`, `home` e `vr-status`. Os códigos aceitos vão de R01 a R05. A tela de progresso lê o percentual de transferência emitido pelo carregador. O evento de prontidão e a presença do canvas e do CSS liberam os comandos.

A consulta inicial tem limite de 30 segundos. A sessão tem limite de 210 segundos, renovado com progresso. Cancelar ou sair aborta a operação, desconecta observadores, libera listeners e remove o iframe. No Studio, voltar ao resultado suspende a sessão para reutilizá-la. Na entrada inicial, o adaptador estaciona o renderizador pelo sinal de suspensão usado pelo motor. Uma falha recuperável oferece nova tentativa e acesso às imagens da clínica.

Use **Foco** para ampliar a área de trabalho e **Tela cheia** quando o navegador oferecer suporte. **Preparar VR** encaminha a solicitação ao visualizador original. A disponibilidade da sessão imersiva depende do navegador e do dispositivo. A homologação física no Quest 2 permanece pendente.
