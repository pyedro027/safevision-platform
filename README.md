# SAFEVISION 3D — Clínica ÁUREA

Base preservada da Versão C para a futura SAFEVISION Platform V1. O visualizador acadêmico exibe a clínica, oferece navegação e permite inspecionar cinco casos pré-documentados com estados de problema e proposta. Inclui modo WebXR com homologação física pendente.

O aplicativo estático e os sete segmentos originais estão em `apps/viewer`. A partir da raiz do repositório, execute:

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory apps/viewer
```

Abra [o painel local](http://127.0.0.1:4173/).

- [Execução e testes](docs/INSTRUCOES_EXECUCAO.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Inventário e hashes](docs/INVENTARIO_VERSAO_C.md)
- [Auditoria](docs/RELATORIO_AUDITORIA.md)
- [Resultados dos testes](docs/RELATORIO_TESTES.md)
- [Continuidade](docs/CONTINUIDADE_IA.md)
- [Roadmap](docs/ROADMAP.md)
