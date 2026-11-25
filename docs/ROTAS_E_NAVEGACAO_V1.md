# Navegação da Demonstration Edition

As rotas usam fragmentos da página. A entrada local é [Visão geral](http://127.0.0.1:4181/#inicio).

| Origem | Destino ou ação | Volta |
|---|---|---|
| Visão geral, `#inicio` | `#explorar?de=inicio` | Visão geral |
| Clínica, `#aurea` | Exploração geral ou `#explorar/R01?de=aurea` até R05 | Clínica |
| Studio, `#studio` | Após preparar a demonstração, `#explorar?de=studio` ou um caso | Resultado do Studio com a cena preparada |
| Inspeções, `#inspecoes` | Fichas `#inspecoes/R01` até R05 | Lista de inspeções |
| Ficha R03, por exemplo | `#explorar/R03?de=inspecoes%2FR03` | Ficha e edição temporária da mesma identidade |
| Ficha interna do 3D | Avaliar este caso | Abre a ficha do caso selecionado |
| Apresentação, `#apresentacao` | Módulos da plataforma e exploração com origem apresentação | Retomar apresentação |
| Relatórios, `#relatorios` | Resumo e impressão A4 | Menu lateral |
| Conta e configurações | `#conta`, `#configuracoes` | Menu lateral |
| Carteira privada | `#projetos`, `#projetos/<id>` | Carteira, com sessão do titular |

Uma origem desconhecida retorna à clínica. Um código desconhecido oferece os cinco casos válidos. O tour histórico permanece em `clinica/WEB/` para rastreabilidade. A edição provisória fica em memória durante a consulta ao 3D. Para preservá-la depois de recarregar ou fechar a aba, use **Salvar rascunho**.
