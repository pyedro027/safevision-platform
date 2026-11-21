# Prévia Vercel

No PR #3 a configuração usa a raiz do repositório com saída `apps/viewer`. Nesta branch o build executa `node scripts/build-platform.mjs` e a saída estática é `dist`. O painel original fica em `/clinica/`, o iframe em `/clinica/WEB/index.html` e o modelo em `/clinica/MODELO/`. Todos compartilham a mesma origem HTTPS.

O total da distribuição original da clínica é 126.038.659 bytes. Cada segmento tem até 16 MiB. O deploy foi criado a partir do GitHub para evitar depender do limite de upload estático da CLI Hobby. A Vercel baixou o commit pelo Git e executou o build sem instalação de dependências.

## Prévia de 21/11/2026

- Equipe `pyedros-projects`, projeto existente `safevision-platform` (`prj_SamWxStm73GFcvHkE3ztEdDQb2bx`). O usuário confirmou o plano Hobby.
- [Preview HTTPS](https://safevision-platform-4y8u5a0md-pyedros-projects.vercel.app/) em `READY`, deploy `dpl_3YyJPvgN6GMACZvbK6q2he3orwm5`, commit `593e343d0fe241446000f220b940137e93dce7cd`, branch `feature/platform-v1-projects`. A produção continuou apontando para o commit inicial `9624453`. A prévia não foi promovida.
- O POST da API rejeitou `target: "preview"` com 400. Na criação aceita, o campo foi omitido com uma ref não produtiva e o resultado confirmou `target: null` e alias exclusivo de branch. O build terminou em `READY`. A consulta da árvore interna de arquivos pelo conector retornou 404. A validação dos recursos usou a própria URL HTTPS.
- A URL exige acesso Vercel à equipe. O ensaio usou o acesso temporário oficial, com a proteção mantida. A URL registrada aqui é a canônica, sem credenciais.
- Dashboard em HTTP 200, cena renderizada em Chrome, navegação verificada e casos R01–R05 alternados. Cada segmento retornou HTTP 200 e coincidiu com o hash do manifesto. GLB recomposto de 113.018.368 bytes com SHA-256 `911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0`. Evidência em [qa-vercel-preview.json](qa-vercel-preview.json).
- `config.json` respondeu com `{}`. Contas e projetos ficam desativados até existir um banco autorizado e configurado. Ao integrar, vincule as variáveis públicas exclusivamente a Preview e use a URL efetiva na lista de redirecionamento do Supabase Auth.

O Chrome confirmou contexto seguro. A sessão imersiva e a interação com controles físicos dependem de teste no Quest 2. A configuração `_headers` integra a distribuição original. A aplicação desses cabeçalhos pela Vercel não foi confirmada.

Após a Missão 06, o esquema do Supabase está pronto, mas a prévia atual ainda usa `config.json` vazio. O próximo deploy conectado deve receber `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` exclusivamente em Preview. O comando de build gera a configuração pública. A chave ativa foi confirmada pelo conector oficial, sem registro do valor. Veja [o relatório da migração](RELATORIO_MIGRACAO_SUPABASE_06.md).

A [proposta da Missão 07](PLANO_AUTH_PREVIEW_07.md) restringe as variáveis à branch `integration/supabase-remote-validation`. O alias dessa branch retornou configuração vazia. A prévia conectada depende de aprovação específica. A branch de revisão da correção PKCE desativa seu deploy automático, sem alterar as regras de outras branches.

O deploy manual da Missão 08 substitui essa proposta histórica. [Preview conectada](https://safevision-platform-2bzty7au8-pyedros-projects.vercel.app/), `dpl_Aq1pu45FoBBxKpAzLXvqZ71TqFza`, commit `6a2a926`. As duas variáveis foram configuradas exclusivamente para Preview da branch `integration/auth-preview-e2e`. O `config.json` respondeu HTTP 200 com apenas `url` e `key`, comparados com o projeto oficial. O deploy está protegido por Vercel Authentication. [Detalhes da Missão 08](RELATORIO_MISSAO_08.md)

- [Configuração estática](https://vercel.com/docs/project-configuration/vercel-json)
- [Limites da Vercel](https://vercel.com/docs/limits)
