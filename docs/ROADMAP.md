# Etapas da SAFEVISION Platform V1

1. Preservar e importar a C com integridade verificável e Pull Request.
2. Consolidar a preparação documental, validar checkout limpo e estruturar CI e uma prévia isolada.
3. Implementar dashboard profissional, projetos e histórico de atividade.
4. Definir Auth, perfis, membros, projetos, revisões e eventos no Supabase. Usar migrações revisadas, RLS por vínculo ao projeto e Storage privado com acesso autorizado.
5. Integrar o visualizador ao dashboard preservando sua entrada, os caminhos e a autonomia de sessão XR.
6. Estender o gerenciamento de riscos e projetos com rastreabilidade por versão.
7. Planejar IA assistiva e, separadamente, conversão de plantas 2D.
8. Validar segurança, desempenho, permissões, compatibilidade e homologação no hardware.

Na Vercel, avaliar preset Other, raiz `apps/viewer`, saída `.` e build/instalação vazios para uma prévia. Preservar as rotas relativas e verificar MIME, HTTPS, cabeçalhos XR e cache. A configuração `_headers` vem da distribuição original e sua aplicação precisa ser confirmada no provedor. Validar os limites e o desempenho com os sete segmentos antes de adotar armazenamento externo.

O GLB monolítico excede o limite por arquivo de 50 MB do Storage Free. Para projetos privados futuros, avaliar upload retomável, limites do plano, hash por versão, URLs assinadas, CORS caso o armazenamento mude de origem e cache compatível com expiração. Projeto, modelo, revisão e autorização são entidades distintas. Manter credenciais privilegiadas no servidor.

- [Compilação e sites estáticos na Vercel](https://vercel.com/docs/builds)
- [Limites de upload do Supabase Storage](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Controle de acesso do Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control)

Para concluir a homologação XR, testar controles físicos, conforto, desempenho e painel em HTTPS no Meta Quest 2. Registrar a versão do navegador e a escala XR usada.

A fundação já tem PR de revisão. O dashboard e a migração passaram nos ensaios locais. A próxima validação usa um ambiente Vercel Preview e um projeto Supabase de desenvolvimento dedicado, com duas contas de teste e entrega de e-mail verificada.
