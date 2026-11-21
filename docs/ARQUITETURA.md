# Arquitetura-alvo — proposta inicial

A arquitetura será confirmada **após leitura do código-fonte original**. Este esquema é direcional, não representa serviços já configurados.

```text
Navegador / Meta Quest 2
         |
         v
Aplicação web SAFEVISION
  |- Portal e dashboard (planejado)
  |- Visualizador Versão C (preservado; importação pendente)
  |- Gestão de projetos (planejada)
  \- Identidade / sessão (planejada)
         |
         +--> Supabase Auth + banco com RLS (futuro)
         |
         +--> Armazenamento autorizado de modelos 3D (a definir)

GitHub -> validação / preview -> Vercel (após definir stack e build)
```

## Princípios técnicos

- Preservar a referência funcional da Versão C antes de refatorar.
- Versionar fonte e configurações não sensíveis; não versionar segredos nem o GLB pesado.
- Manter ambiente de preview separado da versão publicada.
- Respeitar performance móvel/XR, navegação, acessibilidade e segurança.
- Projetos privados por padrão; políticas RLS, regras de acesso e limites de upload deverão ser implementados e testados.

## Decisões ainda em aberto

- Stack frontend real da Versão C.
- Formato dos arquivos e caminhos de importação.
- Solução de hospedagem dos modelos 3D e políticas de acesso.
- Esquema inicial de dados do Supabase e perfis de usuário.
- Processo de builds e testes automatizados.
