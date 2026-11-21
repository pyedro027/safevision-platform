# SAFEVISION Studio

O Studio demonstra a preparação de um projeto arquitetônico para visualização tridimensional. A Clínica ÁUREA usa seu modelo V03 preexistente. O Studio não converte plantas externas em 3D.

## Abrir localmente

Na raiz do repositório, gere a distribuição e sirva a pasta `dist` em loopback.

```sh
node scripts/build-platform.mjs
python -m http.server 4181 --bind 127.0.0.1 --directory dist
```

Abra [SAFEVISION Studio local](http://127.0.0.1:4181/#studio). A tela também pode ser aberta pela navegação lateral e pela Visão geral. O Studio funciona para visitantes. Use loopback ou HTTPS para a função SHA-256 do navegador.

## Entradas

- **Experimentar Clínica ÁUREA** carrega o modelo pronto sem seleção.
- **Importar arquivos da demonstração** exige os dois PDFs da pasta `04_DOCUMENTACAO_E_PRANCHAS/04_PRANCHAS_DERIVADAS/PDF` da integração controlada da Etapa 6.

| Arquivo | Bytes | SHA-256 |
|---|---:|---|
| `SAFEVISION_V03_PLANTAS_2D.pdf` | 252.206 | `68b62a86febada08ce1bf62545437b521abe642a551f0a641aa172b047cbbd9f` |
| `SAFEVISION_V03_DETALHE_TECNICO_R03.pdf` | 93.494 | `2f6541770428731310ae5089034c5f76e063a8ba9fedf005ea024dfa4a55e316` |

Os valores foram verificados com os arquivos reais e com `MANIFESTO_PACOTE_ETAPA6.json`. Nome, quantidade, tamanho, assinatura PDF e SHA-256 precisam corresponder. O navegador mantém a seleção em memória e descarta a referência ao sair do Studio. O módulo não abre o documento como HTML nem o envia à rede. Apenas a lista de identidades dos PDFs é distribuída com o código.

## Arquitetura

- `apps/platform/studio/studio.js` monta a tela e controla seleção, progresso, cancelamento, falha, conclusão e navegação.
- `demo-files.js` identifica o conjunto, sem executar ou renderizar documentos.
- `clinic-session.js` confere o pequeno manifesto e conecta uma instância do tour à interface. O aviso de progresso do tour mede os bytes dos segmentos verificados. A conclusão depende da mensagem `ready` do visualizador, validada por origem e frame.
- A cena fica suspensa entre conclusão e abertura. A abertura, os links R01–R05, o retorno à conclusão e a repetição usam o mesmo iframe. Cancelar um carregamento em curso, falhar ou sair da rota libera o iframe e os observadores.
- O build existente copia os módulos estáticos e os 42 arquivos da Versão C. O Studio não requer servidor próprio, Supabase, Storage ou credenciais.

Uma futura conversão pode substituir os módulos de validação e carregamento por um fluxo real depois que formatos, segurança, métricas e contrato de saída forem definidos. A revisão atual se limita à demonstração da Clínica ÁUREA.

[Resultados e roteiro de teste](RELATORIO_STUDIO_DEMO.md)
