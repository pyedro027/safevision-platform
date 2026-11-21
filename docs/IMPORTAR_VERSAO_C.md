# Procedimento de importação — Versão C

**Estado atual:** documentação e estrutura iniciais criadas. O código original e o modelo 3D da Versão C **ainda não foram recebidos neste repositório**.

## Materiais necessários

- ZIP com HTML, CSS, JavaScript/TypeScript, configurações de build e assets do visualizador atual; ou repositório/artefato de origem autorizado.
- Arquivos auxiliares utilizados pela aplicação, incluindo configurações de navegação e riscos.
- Referência ao modelo GLB/Gltf, seu tamanho e hash SHA-256; não incluir binários pesados antes de decidir hospedagem.
- URL atual de publicação para testes de regressão (não pressupor que uma URL antiga esteja funcionando).
- Capturas dos estados esperados: entrada, navegação, riscos, painel VR e controles móveis.

## Sequência segura

1. Fazer um backup imutável do ZIP recebido e registrar hashes.
2. Inventariar diretórios, dependências externas, tamanho de arquivos e eventuais credenciais.
3. Remover chaves, tokens, senhas e dados privados antes de qualquer commit. **Este repositório foi criado como público**; confirmar se deverá ser privado.
4. Montar e testar a aplicação **sem alterar o comportamento**.
5. Importar o código em uma branch separada; revisar diferenças.
6. Validar o visualizador, os riscos R01–R05 e o modo XR em ambiente de teste.
7. Só então integrar dashboard, Supabase e publicação na Vercel.

## Armazenamento de modelos grandes

O histórico do projeto menciona um GLB de aproximadamente 113 MB, informação que deve ser confirmada após o recebimento do arquivo. Não fazer commit desse GLB diretamente no Git: arquivos convencionais acima de 100 MiB são rejeitados pelo GitHub. Avaliar armazenamento externo com CORS adequado, cache e autenticação conforme o modelo de acesso definido. Não presumir que o limite de upload de qualquer serviço seja suficiente sem verificar o plano atual.

## O que não fazer

- Não reconstruir a Clínica ÁUREA do zero.
- Não substituir nem sobrescrever a Versão C publicada.
- Não declarar o Quest 2 homologado sem teste físico.
- Não apresentar a identificação de riscos como certificação normativa.
