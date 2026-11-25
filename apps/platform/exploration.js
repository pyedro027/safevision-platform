import { checkClinicResources, loadClinic } from './studio/clinic-session.js';
import { codes } from './inspection-store.js';

const origins = new Map([
  ['inicio','Voltar à visão geral'], ['aurea','Voltar à clínica'], ['studio','Voltar ao Studio'],
  ['inspecoes','Voltar às inspeções'], ['apresentacao','Retomar apresentação'],
  ...codes.map(code => ['inspecoes/'+code,'Voltar à ficha'])
]);

export function exploreLink(origin, code = '') {
  return '#explorar' + (code ? '/' + code : '') + '?de=' + encodeURIComponent(origin);
}

export function exploreRoute(hash) {
  const [path, query] = hash.split('?');
  const origin = new URLSearchParams(query).get('de');
  const [,code = '', extra] = path.split('/');
  return { code, valid:extra === undefined && (!code || codes.includes(code)), origin:origins.has(origin) ? origin : 'aurea' };
}

// Shared by the canonical route and the prepared Studio session.
export function viewerBar(root, origin, send, back) {
  const bar = root.querySelector('.viewer-bar');
  bar.innerHTML = `<div class="viewer-title"><small>Exploração 3D</small><strong>Clínica ÁUREA</strong></div>
    <div class="viewer-tools"><button data-tool="back"></button><button data-tool="vr">Preparar VR</button>
    <button data-tool="focus" aria-pressed="false">Foco</button><button data-tool="full">Tela cheia</button></div><p class="viewer-note" role="status" hidden></p>`;
  const select = key => bar.querySelector('[data-tool="'+key+'"]');
  const full = select('full');
  const vr = select('vr');
  const note = bar.querySelector('.viewer-note');
  function message(text) { note.hidden = !text; note.textContent = text; }
  select('back').textContent = origins.get(origin);
  select('back').onclick = back;
  vr.disabled = true;
  vr.onclick = () => { send('vr'); root.querySelector('iframe')?.focus(); };
  const life = new AbortController();
  const focus = select('focus');
  focus.onclick = () => focus.setAttribute('aria-pressed', String(root.classList.toggle('viewer-focus')));
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && root.classList.contains('viewer-focus')) focus.click();
  }, {signal:life.signal});
  const fullLabel = () => { full.textContent = document.fullscreenElement === root ? 'Sair da tela cheia' : 'Tela cheia'; };
  document.addEventListener('fullscreenchange', fullLabel, {signal:life.signal});
  full.hidden = !document.fullscreenEnabled;
  full.onclick = async () => {
    try { if (document.fullscreenElement === root) await document.exitFullscreen(); else await root.requestFullscreen(); }
    catch { message('Tela cheia indisponível neste navegador.'); }
  };
  return { ready: value => { vr.disabled = !value; }, message, dispose() {life.abort();} };
}

export function mountExploration(screen, route) {
  screen.innerHTML = '<section class="viewer-shell"><header class="viewer-bar"></header><div class="viewer-loading" role="status"></div><div class="studio-frame"></div></section>';
  const root = screen.firstElementChild;
  const status = root.querySelector('.viewer-loading');
  const host = root.querySelector('.studio-frame');
  let session;
  let run;
  let ready = false;
  const back = () => {location.hash = route.origin;};
  const tools = viewerBar(root,route.origin,action => session?.send(action),back);
  function stop() {
    run?.abort();
    session?.dispose();
    session = undefined;
    ready = false;
    tools.ready(false);
  }
  function error(message) {
    stop();
    status.hidden = false;
    status.innerHTML = '<h2>Modelo indisponível</h2><p></p><button>Tentar novamente</button> <a href="#aurea">Consultar imagens e casos</a>';
    status.querySelector('p').textContent = message;
    status.querySelector('button').onclick = start;
  }
  async function start() {
    stop();
    if (!route.valid) {
      status.innerHTML = '<h2>Caso desconhecido</h2><p>Selecione uma ficha para abrir o modelo.</p>' +
        codes.map(c => '<a class="button secondary" href="'+exploreLink(route.origin,c)+'">'+c+'</a>').join(' ');
      return;
    }
    const controller = new AbortController();
    run = controller;
    status.hidden = false;
    status.innerHTML = '<h2>Carregando a clínica</h2><progress max="100" aria-label="Transferência do modelo"></progress><p>Verificando o manifesto da V03…</p><button class="secondary">Cancelar</button>';
    status.querySelector('button').onclick = back;
    try {
      await checkClinicResources(AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]));
      if (controller.signal.aborted) return;
      status.querySelector('p').textContent = 'Preparando o visualizador…';
      session = loadClinic(host,{
        progress(percent) {
          session.keepWaiting();
          status.querySelector('progress').value = percent;
          status.querySelector('p').textContent = percent === 100 ? 'Inicializando a cena…' : percent+'% do modelo transferido';
        },
        ready() {
          ready = true;
          status.hidden = true;
          tools.ready(true);
          session.send('resume');
          if (route.code) session.send('risk',{code:route.code});
        },
        home:back, failure:error, vrStatus:tools.message
      });
    } catch { if (!controller.signal.aborted) error('Falha na leitura do manifesto. Confira a conexão local.'); }
  }
  start();
  return {
    update(next) {
      if (next.code !== route.code && ready && next.code) session.send('risk',{code:next.code});
      route = next;
    },
    dispose() {stop(); tools.dispose();}
  };
}
