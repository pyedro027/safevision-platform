# Executar a Versão C

Clone `https://github.com/pyedro027/safevision-platform.git` e selecione a branch `import/versao-c-original`. A distribuição está em `apps/viewer`. Os sete arquivos em `MODELO` são servidos individualmente, mantendo os nomes e os hashes do manifesto. O modelo completo é montado no navegador.

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory apps/viewer
```

No Windows também é possível usar `py -3`. Abra [o painel local](http://127.0.0.1:4173/) e escolha **Abrir visualizador 3D**. Para abrir o tour diretamente, visite `/WEB/`. Use HTTP em loopback para desenvolvimento e HTTPS no headset, com painel, tour e recursos na mesma origem. Abrir o HTML como arquivo local impede as requisições do navegador.

Não há instalação de dependências da aplicação nem etapa de compilação. A versão em `apps/viewer` é a saída estática. Com Node.js 24, rode `node tests/motor.mjs` para repetir os seis ensaios do motor. Com Python 3, rode `python tests/integridade.py` para verificar a distribuição.

Para inspecionar, use WASD e mouse, ou habilite **Controles na tela**. Confira os marcadores e os estados **Com problema** e **Proposta** nos cinco casos. No Quest Browser, selecione o perfil XR, prepare a sessão e inicie no segundo clique. Use **Passear** para andar com o analógico esquerdo e girar com o direito. O grip reabre o painel. Homologação exige o dispositivo.
