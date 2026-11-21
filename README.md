# SAFEVISION Platform V1

Plataforma experimental de visualização 3D/VR e análise didática de riscos ocupacionais, desenvolvida a partir do projeto SAFEVISION 3D — Clínica ÁUREA (SENAC/ES).

> **Estado:** preparação da infraestrutura. O código-fonte original da Versão C ainda não foi importado nem auditado neste repositório. Não apresentar esta estrutura como um aplicativo funcional.

## Objetivo imediato

Importar a Versão C existente sem alterar sua experiência de navegação, cenário e registros de riscos. Preservar a versão original como referência verificável antes de adicionar autenticação, dashboard ou armazenamento.

## Prioridades

1. Obter e inventariar os arquivos reais da Versão C, com hashes e dependências.
2. Executar localmente a versão original e registrar evidências de funcionamento.
3. Validar a navegação 3D, as interações com os riscos e a experiência VR/WebXR.
4. Preparar a publicação web com separação entre código e modelos 3D grandes.
5. Planejar dashboard, autenticação e persistência somente após o baseline validado.

## Documentação

- [Arquitetura proposta](docs/ARQUITETURA.md)
- [Procedimento para importar a Versão C](docs/IMPORTAR_VERSAO_C.md)
- [Roadmap](docs/ROADMAP.md)

## Cuidados

- **Não** incluir tokens, chaves de serviço ou arquivos `.env` reais no Git.
- **Não** colocar o GLB de aproximadamente 113 MB diretamente no Git convencional.
- **Não** modificar, renumerar ou reinterpretar R01–R05 sem comparar com os arquivos originais.
- O protótipo é didático; as identificações de risco não substituem avaliação técnica de segurança do trabalho.

## Próxima dependência

Disponibilizar o ZIP/código da Versão C ou o endereço de seu repositório-fonte. A migração não pode ser considerada concluída sem esses arquivos.
