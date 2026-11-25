# Carregamento e ciclo de vida

Chrome 159.0.8154.33 em Windows, execução automatizada e renderização por software habilitada. Em loopback, o teste mediu **2,94 segundos** entre acionar a retentativa e a liberação do visualizador. É uma observação dessa execução. O modelo tem 113.018.368 bytes. A captura, as condições de cache, a GPU e a rede influenciam o tempo percebido. [Medição](evidencias-missao-16/visualizador/result.json).

As telas de conta e projetos abriram sem iframe e sem pedidos de segmentos. No fluxo do Studio, a primeira carga fez sete pedidos de segmentos. A repetição e as visitas aos cinco riscos reutilizaram o mesmo documento e a mesma cena. Voltar para o dashboard removeu o iframe. A exploração independente também libera a sessão ao sair. O teste confirma o ciclo de vida observável. Memória de GPU e FPS sustentado em headset ainda dependem de medição no equipamento físico. [Regressão do Studio](evidencias-missao-16/integracao/studio.json).

Para apresentar, abra o Studio e prepare o modelo antes do trecho ao vivo. Use o perfil Desempenho em computadores com GPU integrada. Se a rede externa falhar, a clínica e o relatório local continuam disponíveis quando servidos da pasta de distribuição.
