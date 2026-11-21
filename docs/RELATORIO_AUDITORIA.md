# Auditoria técnica da Versão C

Conferência em 21/11/2026. A distribuição de referência, a cópia de segurança e a cópia de trabalho têm 42 arquivos, todos com os mesmos hashes do manifesto ETAPA7.3. HTML, CSS, JavaScript ES Modules e Babylon.js 9.30.0, sem framework frontend, build ou dependências a instalar para execução. Entradas, módulos, dados e ativos estão no diretório estático `apps/viewer`.

## Modelo, navegação e inspeção

Os sete segmentos já existentes formam um GLB v2 de 113018368 bytes. O modelo tem 57 malhas e 43 materiais, sem buffers ou imagens externos. A navegação tem 21 ambientes, 57 grupos, 24 portas e 270 colisores. O movimento convencional usa teclado, mouse e controles na tela, com gamepad opcional condicionado ao mapeamento standard. Ambos os modos usam o elipsoide e o motor de colisões do Babylon. As portas calculam proximidade, atualizam a folha e o colisor e podem recusar fechamento junto à dobradiça.

Cada ficha tem JSON e Markdown em `WEB/data/fichas`, âncoras para PROB e CORR e referências preservadas. A inspeção localiza o caso e alterna os estados. R05 tem vista técnica adicional.

| Código | Local e elemento associado | Implementação |
|---|---|---|
| R01 | C03, limite de A12 e passagem P10 | Circulação e dimensionamento |
| R02 | Extremidade leste de C01, P02-I e P02-E | Vestíbulo e portas sucessivas |
| R03 | Sanitário A04 | Lavatório em relação à transferência |
| R04 | A08, J01 e DEF_EST_P01 | Interferência janela e pilar |
| R05 | A09, F009 e BASE_EST_V01 | Interferência tubulação e viga |

As fichas são demonstração acadêmica. Os dados não constituem certificação normativa.

## WebXR

O código consulta suporte em contexto seguro e prepara a sessão no primeiro clique. Um segundo clique inicia `immersive-vr` em `local-floor`. O Babylon gerencia câmera estereoscópica e eventos da sessão. O painel 1536 × 1152 contém navegação por páginas, laser e áreas de toque calculadas a partir das coordenadas do desenho. Os perfis XR solicitam escalas 0,65, 0,85 e 1,0. O analógico esquerdo move, o direito gira em passos de 30 graus. O menu interrompe a locomoção. A disponibilidade e a resposta real dos controles exigem o Quest.

## Integridade e pontos de atenção

- Sintaxe conferida em 15 scripts. Referências de HTML e imports locais presentes. O código de carregamento usa URLs relativas. A varredura de texto próprio e fichas não encontrou credenciais nem caminhos locais ativos. Ocorrências de barra após dois-pontos eram URLs públicas ou sintaxe JavaScript. As bibliotecas locais correspondem aos hashes da distribuição publicada. A varredura é heurística e não certifica o conteúdo.
- `babylon.js` referencia um source map ausente. O mapa serve ao depurador e não é necessário ao runtime. Nenhuma dependência essencial faltou na execução local.
- O pacote serve cerca de 120 MiB, com 107,78 MiB de modelo. Projeto pesado para renderização por software e headset. Validar latência, qualidade, memória e fluidez em hardware real antes de otimizar. Mudanças no modelo precisam de aprovação e regressão.
- Git LFS 3.8.1 disponível. A cota da conta não foi consultada. O maior objeto que será enviado ao Git tem 16 MiB. Usar os sete segmentos do pacote preserva o carregador e evita depender da cota LFS. O GLB monolítico e o Blender ficam fora do Git. LFS, se adotado no futuro, resolve versionamento e requer uma estratégia distinta de entrega HTTPS ao navegador.
- O repositório oficial foi confirmado público. A área publicável é a distribuição já utilizada em homologação e os documentos produzidos para o repositório. Backups, perfis de hospedagem, relatórios internos, credenciais, artefatos de autoria e dependências de QA locais ficam fora dos commits.

- [Limites de objetos no GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)
- [Cotas e cobrança do Git LFS](https://docs.github.com/en/billing/concepts/product-billing/git-lfs)
