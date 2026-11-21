# SAFEVISION Platform V1 — Roadmap

Este documento descreve o planejamento, **não a implementação concluída**.

## Base existente

A Versão C (Clínica ÁUREA) é a referência funcional a preservar. Conforme histórico do projeto, inclui visualização 3D e recursos de XR para Meta Quest 2. O arquivo-fonte dessa versão ainda **não foi incorporado nem validado neste repositório**.

## Entregas por etapa

1. **Preservação e inventário da Versão C (primeira prioridade).**
   - Obter ZIP ou pasta íntegra de código, configuração e recursos.
   - Registrar o estado atual, screenshots, URL de implantação, dependências e hashes dos arquivos essenciais.
   - Rodar a versão atual sem alterações e registrar o resultado.
   - Verificar navegação, marcadores de riscos R01–R05, portas, colisores, controles de tela e XR.
2. **Separação da aplicação em módulos.**
   - Isolar o visualizador legado antes de introduzir mudanças na lógica.
   - Definir a estrutura de frontend a partir do stack real encontrado, evitando reescrita prematura.
   - Construir uma homepage e um dashboard sem interromper o visualizador.
3. **Implantação e entrega contínua.**
   - Configurar Vercel apenas após confirmar o processo de build.
   - Criar ambiente de preview para validar mudanças antes da produção.
   - Evitar substituir a implantação estável da Versão C.
4. **Autenticação e dados persistentes.**
   - Integrar Supabase Auth e políticas RLS para isolar dados de cada usuário.
   - Projetos, configurações, arquivos e histórico com escopo por usuário.
   - Segredos e chaves administrativas exclusivamente no servidor/serviço adequado; nunca no Git.
5. **Homologação de XR.**
   - Testar em Meta Quest 2 real, em HTTPS, com checklist de controles, conforto e performance.
   - Registrar problemas e correções; publicação online por si só não equivale a homologação física.
6. **Funcionalidades avançadas (futuras).**
   - Conversão assistida de plantas 2D em cenários 3D.
   - Apoio automatizado à identificação e classificação de riscos, sujeito a validação humana e técnica.

## Critérios para iniciar implementação

- [ ] Código-fonte da Versão C disponível.
- [ ] Inventário de arquivos e dependências concluído.
- [ ] Cópia de segurança verificada.
- [ ] Stack de execução e build conhecido.
- [ ] Planejamento de armazenamento para o modelo 3D definido.
- [ ] Ambientes de preview e produção separados.

## Limites

O modelo é demonstrativo e acadêmico. As indicações de risco não substituem análise técnica ou responsabilidade profissional.
