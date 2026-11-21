# Missão 11 — SAFEVISION Studio

Em 21/11/2026 o Studio foi implementado na branch `feature/safevision-studio-demo`, baseada no PR #7, commit `ffbfc54c0f302b56d1a192f63fbd0721a33bf68d`. A revisão inclui UI, validação dos PDFs oficiais, carregamento real do tour e acesso à inspeção R01–R05.

## Testes executados

| Caso | Resultado local |
|---|---|
| Dashboard e Studio | Chrome 157. Abertura pelo menu via teclado, seletor com teclado, layout desktop e 375 px, sem rolagem horizontal. |
| Seleção | Dois PDFs da Etapa 6 validados com seus bytes reais. Também passaram drag and drop via DataTransfer, remoção, limpeza, cancelamento do seletor, duplicata, excesso de quantidade, extensão inválida, tamanho acima do limite e PDF com mesmo nome e tamanho mas hash diferente. |
| Falha e recuperação | Resposta 503 simulada no manifesto, cancelamento durante requisição pendente de segmento e interrupção simulada na transferência. A interface exibiu diagnóstico e carregou após tentar novamente. |
| Modelo e conclusão | Progresso baseado em etapas e bytes verificados. Conclusão após mensagem do tour. O teste viu sete requisições de segmentos no carregamento, sem transferência adicional ao abrir ou repetir com a cena pronta. Os dois caminhos chegaram à conclusão. |
| Regressão 3D | Navegação por teclado e mouse, controles na tela, porta P03, colisor F060 e alternância problema/proposta em R01–R05. Conferidos os 42 arquivos, hashes individuais e GLB de 113.018.368 bytes. |
| Segurança e integração | Apenas requisições HTTP GET para a mesma origem durante o Studio. Zero chamadas externas no teste. Configuração local sem Supabase. Zero erros de página, console e HTTP inesperados nas execuções bem-sucedidas. |
| Dashboard e motor | `tests/platform_browser.py` passou com API simulada e `tests/motor.mjs` passou nos seis casos. A rodada de dashboard com API simulada não representa autenticação remota. |

O hash agregado servido foi `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. [Resultado estruturado](qa-studio-demo.json)

As capturas locais da Missão 11 incluem desktop, celular, seleção validada, erro recuperável, carregamento, conclusão e inspeção de R05. Os PDFs de entrada ficaram no projeto local.

## Reproduzir

Após o build descrito no [guia do Studio](SAFEVISION_STUDIO.md), execute com Python, Playwright e Chrome. O teste inicia um servidor temporário de loopback e usa o diretório dos PDFs oficiais fornecido como argumento.

```sh
python tests/studio_browser.py "<pasta dos PDFs oficiais>" "<pasta de evidências>" --chrome "<caminho do Chrome>"
python tests/integridade.py
node tests/motor.mjs
```

## Limites

O fluxo usa os PDFs para identificar o projeto e abre a modelagem existente. A homologação física no Quest 2 e a homologação Auth/RLS com duas contas são etapas separadas. A branch desativa seu deploy automático. A prévia anterior e a produção Vercel foram preservadas. [Configuração Git da Vercel](https://vercel.com/docs/project-configuration/git-configuration)
