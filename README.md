# SAFEVISION Platform V1

## Demonstration Edition · Missão 16

Branch `feature/demonstration-edition-v1`, derivada de `b7af326`. A entrega pode ser revisada no [PR #13](https://github.com/pyedro027/safevision-platform/pull/13). Acesse [a apresentação local](http://127.0.0.1:4181/#apresentacao) ou [o modelo](http://127.0.0.1:4181/#explorar?de=inicio). A partir da raiz do repositório, `python scripts/servir-demonstracao.py` inicia a distribuição pronta em loopback.

[Relatório A–K](docs/RELATORIO_MISSAO_16.md) · [Testes e evidências](docs/QA_MISSAO_16.md).


O dashboard de desenvolvimento organiza projetos privados e dá acesso à Clínica ÁUREA. O visualizador acadêmico da Versão C mantém os cinco casos pré-documentados com estados de problema e proposta. A homologação física WebXR continua pendente.

O dashboard está em `apps/platform`. O visualizador e os sete segmentos originais estão em `apps/viewer`. A partir da raiz do repositório, execute:

```sh
node scripts/build-platform.mjs
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Abra [o dashboard local](http://127.0.0.1:4173/). A demonstração está em `/clinica/`. Contas e persistência requerem a configuração do ambiente Supabase dedicado.

- [Execução e testes](docs/INSTRUCOES_EXECUCAO.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Inventário e hashes](docs/INVENTARIO_VERSAO_C.md)
- [Auditoria](docs/RELATORIO_AUDITORIA.md)
- [Resultados dos testes](docs/RELATORIO_TESTES.md)
- [Continuidade](docs/CONTINUIDADE_IA.md)
- [Roadmap](docs/ROADMAP.md)
- [Prévia Vercel](docs/VERCEL_DEPLOYMENT.md)
- [Configuração Supabase](docs/SUPABASE_SETUP.md)
- [Segurança](docs/SEGURANCA.md)
