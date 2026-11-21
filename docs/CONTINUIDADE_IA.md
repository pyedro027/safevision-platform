# Continuidade para o próximo agente

SAFEVISION 3D usa a Clínica ÁUREA como demonstração acadêmica de inspeção de riscos pré-documentados. Use a importação da Versão C como base de regressão e consulte o PR de preparação #1 quando consolidar a proposta de plataforma. A arquitetura real é estática e usa Babylon.js. Os cinco casos são R01 circulação, R02 rota de saída, R03 acessibilidade, R04 janela e pilar e R05 tubulação e viga.

O código e os sete segmentos estão em `apps/viewer`. Sirva essa pasta como raiz por HTTP local e HTTPS em um dispositivo externo. Consulte [os comandos](INSTRUCOES_EXECUCAO.md), [a arquitetura](ARQUITETURA.md), [o inventário](INVENTARIO_VERSAO_C.md) e [as evidências de teste](RELATORIO_TESTES.md).

Preserve a geometria da clínica, os dois estados de cada risco, as fichas, os 270 colisores, as 24 portas, os caminhos relativos e o fluxo de entrada XR. Faça mudanças em branch separada. Inicie a V1 pela consolidação dos dois PRs e pela prévia estática com verificação de regressão. Defina o modelo de autorização e armazenamento antes de integrar Auth e upload. O teste físico continua pendente e precisa cobrir conforto, controles, painel e estabilidade no Quest 2.
