const modelRoot = './clinica/MODELO/';
const tourUrl = './visualizador.html';
const startupTimeout = 210_000;

export async function checkClinicResources(signal) {
  const response = await fetch(modelRoot + 'model-manifest.json', { signal });
  if (!response.ok) throw new Error('O manifesto do modelo está indisponível.');
  const manifest = await response.json();
  if (manifest.bytes !== 113018368
    || manifest.sha256 !== '911f6af402a19aca8b6825ab6df840b56d3100089cbb69e4c0d4a705588402f0'
    || manifest.parts?.length !== 7) {
    throw new Error('O manifesto não corresponde ao modelo oficial da Clínica ÁUREA.');
  }
}

export function loadClinic(host, { progress, ready, failure, home, vrStatus }) {
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const frame = document.createElement('iframe');
  frame.title = 'Clínica ÁUREA em 3D';
  frame.allow = 'xr-spatial-tracking; fullscreen';
  frame.allowFullscreen = true;

  let timer;
  let observer;
  let started = false;
  function watchTimeout() {
    clearTimeout(timer);
    timer = setTimeout(() => failure('O visualizador demorou para responder. Confira a rede e tente novamente.'), startupTimeout);
  }
  function send(action, data) {
    if (listeners.signal.aborted || !['risk','vr','pause','resume'].includes(action)) return;
    if (action === 'risk' && !/^R0[1-5]$/.test(data?.code)) return;
    frame.contentWindow?.postMessage({ channel: 'safevision', action, ...data }, location.origin);
  }
  function inspect() {
    const status = frame.contentDocument?.getElementById('loadMessage');
    if (status?.getAttribute('role') === 'alert') return failure(status.textContent);
    const match = status?.textContent.match(/Carregando a clínica · (\d+)%/);
    if (match) progress(Number(match[1]));
  }

  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow
      || event.data?.channel !== 'safevision') return;
    if (event.data.event === 'ready' && !started) {
      started = true;
      const doc = frame.contentDocument;
      if (doc?.body.dataset.edition !== 'integrated' || !doc.getElementById('tour') ||
          !getComputedStyle(doc.body).getPropertyValue('--forest').trim()) {
        return failure('Interface integrada indisponível. Refaça o carregamento.');
      }
      for (const button of doc.body.querySelectorAll(':scope > button')) {
        if (button.textContent === '← Painel SAFEVISION') button.hidden = true;
      }
      clearTimeout(timer);
      // Park the render loop while keeping the original welcome screen.
      const runtime = frame.contentWindow.__tourDebug;
      if (runtime) runtime.suspended = true;
      else send('pause');
      ready();
    }
    if (event.data.event === 'home') home();
    if (event.data.event === 'vr-status' && typeof event.data.text === 'string') vrStatus?.(event.data.text);
  }, options);

  frame.addEventListener('load', () => {
    observer?.disconnect();
    const status = frame.contentDocument?.getElementById('loadMessage');
    if (!status) return failure('A página do visualizador está indisponível.');
    inspect();
    if (listeners.signal.aborted) return;
    observer = new MutationObserver(inspect);
    observer.observe(status, { childList: true, subtree: true, characterData: true, attributes: true });
  }, options);
  watchTimeout();
  frame.src = tourUrl;
  host.append(frame);

  return {
    send,
    keepWaiting: watchTimeout,
    dispose() {
      clearTimeout(timer);
      observer?.disconnect();
      listeners.abort();
      frame.remove();
    },
  };
}
