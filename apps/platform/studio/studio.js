import { exploreLink, viewerBar } from '../exploration.js';
import { demoFiles, validateDemoFile } from './demo-files.js';
import { checkClinicResources, loadClinic } from './clinic-session.js';

const cases = ['Circulação', 'Rota de saída', 'Acessibilidade', 'Janela e pilar', 'Tubulação e viga'];
const riskCode = index => `R0${index + 1}`;
const steps = [
  'Identificação do projeto demonstrativo',
  'Preparação do ambiente arquitetônico',
  'Preparação dos recursos tridimensionais',
  'Carregamento da modelagem 3D',
  'Ambiente 3D disponível',
];
const sizes = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const template = `<div class="studio" aria-live="off">
  <div class="intro">
    <h1>SAFEVISION Studio</h1>
    <p class="muted">Explore o fluxo de importação e preparação de projetos arquitetônicos para visualização tridimensional.</p>
  </div>
  <div class="studio-grid" data-studio-panel="selection">
    <section class="studio-card studio-import" aria-labelledby="studio-import-title">
      <h2 id="studio-import-title">Importar arquivos da demonstração</h2>
      <label class="studio-drop" for="studio-files">
        <span>Arraste os dois PDFs oficiais</span>
        <span class="studio-file-prompt">ou selecione no computador</span>
        <input id="studio-files" type="file" accept=".pdf,application/pdf" multiple aria-describedby="studio-file-help">
      </label>
      <p id="studio-file-help" class="muted">A identificação do par é feita no navegador. Seus arquivos não são enviados.</p>
      <details class="studio-expected">
        <summary>Ver arquivos aceitos</summary>
        <ul>${demoFiles.map(file => `<li>${file.name}</li>`).join('')}</ul>
      </details>
      <ul class="studio-files" aria-label="Arquivos selecionados"></ul>
      <p class="studio-feedback" role="status" hidden></p>
      <div class="actions">
        <button type="button" data-studio-action="import" disabled>Preparar demonstração</button>
        <button type="button" class="secondary" data-studio-action="clear" hidden>Limpar seleção</button>
      </div>
    </section>
    <article class="studio-demo">
      <img src="./clinica/assets/recepcao.png" alt="Recepção da Clínica ÁUREA">
      <div class="studio-demo-copy">
        <h2>Clínica ÁUREA</h2>
        <p>Explore o modelo existente e seus cinco casos de inspeção. A conversão de plantas externas ainda não está disponível.</p>
        <button type="button" data-studio-action="demo">Experimentar Clínica ÁUREA</button>
      </div>
    </article>
  </div>
  <section class="studio-card studio-progress" data-studio-panel="progress" hidden>
    <div class="heading-row">
      <div><h2>Preparando a Clínica ÁUREA</h2><p class="muted">Demonstração com modelagem preexistente.</p></div>
      <button type="button" class="secondary" data-studio-action="cancel">Cancelar</button>
    </div>
    <progress max="5" value="0" aria-label="Etapas concluídas"></progress>
    <ol class="studio-steps">${steps.map(step => `<li>${step}</li>`).join('')}</ol>
    <p class="studio-load-status" role="status"></p>
  </section>
  <section class="studio-card studio-result" data-studio-panel="result" hidden>
    <div class="studio-result-top">
      <div>
        <h2 tabindex="-1">Demonstração de modelagem 3D concluída</h2>
        <p>O modelo tridimensional preexistente da Clínica ÁUREA foi carregado e está pronto para exploração.</p>
        <p class="muted studio-source"></p>
        <div class="actions">
          <button type="button" data-studio-action="open">Abrir ambiente 3D</button>
          <button type="button" class="secondary" data-studio-action="repeat">Repetir demonstração</button>
          <a href="#inicio">Voltar ao dashboard</a>
        </div>
      </div>
      <img src="./clinica/assets/recepcao.png" alt="Recepção da Clínica ÁUREA">
    </div>
    <h3>Casos de inspeção</h3>
    <ul class="studio-cases">${cases.map((name, index) => `<li><button type="button" class="secondary" data-studio-action="risk" data-code="${riskCode(index)}"><strong>${riskCode(index)}</strong> ${name}</button></li>`).join('')}</ul>
  </section>
  <section class="studio-card studio-error" data-studio-panel="error" hidden>
    <h2 tabindex="-1">Não foi possível preparar a Clínica ÁUREA</h2>
    <p role="alert"></p>
    <div class="actions">
      <button type="button" data-studio-action="retry">Tentar novamente</button>
      <button type="button" class="secondary" data-studio-action="selection">Voltar à seleção</button>
    </div>
  </section>
  <section class="studio-viewer" aria-label="Ambiente 3D" inert aria-hidden="true">
    <header class="viewer-bar"></header>
    <div class="studio-frame"></div>
  </section>
</div>`;

export function mountStudio(screen) {
  screen.innerHTML = template;
  const studio = screen.firstElementChild;
  const find = selector => studio.querySelector(selector);
  const action = name => find(`[data-studio-action="${name}"]`);
  const panel = name => find(`[data-studio-panel="${name}"]`);
  const feedback = find('.studio-feedback');
  const picker = find('#studio-files');
  const drop = find('.studio-drop');
  const frameHost = find('.studio-frame');
  const viewer = find('.studio-viewer');
  const status = find('.studio-load-status');
  let files = [];
  let validation = 0;
  let authorizedFiles = false;
  let run;
  let clinic;
  let clinicReady = false;
  let currentMode = 'demo';
  let activePanel = 'selection';

  const bar = viewerBar(viewer,'studio',cmd => clinic?.send(cmd),() => {location.hash='studio';});
  function message(text) {
    feedback.hidden = !text;
    feedback.textContent = text;
  }

  function show(name, focus) {
    activePanel = name;
    for (const element of studio.querySelectorAll('[data-studio-panel]')) {
      element.hidden = element.dataset.studioPanel !== name;
    }
    viewer.classList.toggle('studio-viewer-live', name === 'viewer');
    viewer.inert = name !== 'viewer';
    viewer.setAttribute('aria-hidden', String(name !== 'viewer'));
    focus?.focus();
  }

  function drawFiles(rows) {
    find('.studio-files').replaceChildren(...rows.map(({ file, status: result }, index) => {
      const row = document.createElement('li');
      const details = document.createElement('div');
      const name = document.createElement('strong');
      const meta = document.createElement('small');
      const extension = file.name.includes('.') ? file.name.split('.').at(-1).toUpperCase() : 'Sem extensão';
      name.textContent = file.name;
      meta.textContent = `${extension} · ${sizes.format(file.size / 1024)} KiB · ${result || 'PDF oficial'}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary';
      remove.textContent = 'Remover';
      remove.setAttribute('aria-label', `Remover ${file.name}`);
      remove.dataset.studioAction = 'remove';
      remove.dataset.index = index;
      details.append(name, meta);
      row.append(details, remove);
      return row;
    }));
  }

  async function validateSelection() {
    const selection = files;
    const revision = ++validation;
    authorizedFiles = false;
    action('import').disabled = true;
    action('clear').hidden = !selection.length;
    drawFiles(selection.map(file => ({ file, status: 'Verificando' })));
    message(selection.length ? 'Verificando os arquivos selecionados…' : '');
    const rows = await Promise.all(selection.map(async file => ({
      file,
      status: await validateDemoFile(file, selection).catch(() => 'Não foi possível verificar este PDF.'),
    })));
    if (revision !== validation) return;
    authorizedFiles = rows.length === demoFiles.length && rows.every(row => !row.status);
    action('import').disabled = !authorizedFiles;
    drawFiles(rows);
    if (authorizedFiles) message('Conjunto oficial identificado. Você já pode preparar a demonstração.');
    else if (rows.some(row => row.status)) message('O conjunto não foi reconhecido. A conversão automática de plantas externas ainda não está disponível.');
    else message(rows.length ? 'Selecione também o outro PDF do conjunto oficial.' : '');
  }

  function addFiles(incoming) {
    if (!incoming.length) return;
    if (files.length + incoming.length > demoFiles.length) {
      message(`Selecione até ${demoFiles.length} PDFs. Remova arquivos para trocar a seleção.`);
      return;
    }
    files = [...files, ...incoming];
    void validateSelection();
  }

  function setStage(completed, detail) {
    find('.studio-progress progress').value = completed;
    for (const [index, item] of Array.from(studio.querySelectorAll('.studio-steps li')).entries()) {
      item.dataset.complete = String(index < completed);
      if (index === completed) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    }
    status.textContent = detail;
  }

  function releaseClinic() {
    run?.abort();
    run = undefined;
    clinic?.dispose();
    clinic = undefined;
    clinicReady = false;
    bar.ready(false);
  }

  function fail(text) {
    releaseClinic();
    panel('error').querySelector('[role="alert"]').textContent = text;
    show('error', panel('error').querySelector('h2'));
  }

  function finish() {
    clinicReady = true;
    bar.ready(true);
    setStage(5, 'Ambiente 3D disponível.');
    find('.studio-source').textContent = currentMode === 'import'
      ? 'Origem · PDFs oficiais identificados no navegador'
      : 'Origem · demonstração sem arquivos selecionados';
    show('result', panel('result').querySelector('h2'));
  }

  async function start(mode) {
    if (mode === 'import' && !authorizedFiles) return;
    currentMode = mode;
    const controller = new AbortController();
    run = controller;
    show('progress', action('cancel'));
    setStage(1, 'Projeto identificado. Conferindo o manifesto da modelagem V03…');
    try {
      await checkClinicResources(AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
      if (controller.signal.aborted) return;
      setStage(2, 'Manifesto conferido. Preparando o visualizador e os recursos da clínica…');
      if (clinicReady) return finish();
      clinic = loadClinic(frameHost, {
        progress(percent) {
          if (clinicReady) return;
          clinic.keepWaiting();
          setStage(3, percent === 100
            ? 'Sete segmentos verificados. Inicializando a cena 3D…'
            : `Modelo transferido e verificado · ${percent}% dos bytes`);
        },
        ready: finish,
        failure: fail,
        home: () => {location.hash = 'studio';}, vrStatus:bar.message,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      fail(error.name === 'TimeoutError' || error instanceof TypeError
        ? 'Não foi possível consultar o manifesto. Confira a conexão e tente novamente.'
        : error.message);
    }
  }

  function openViewer(code) {
    show('viewer', viewer.querySelector('[data-tool=back]'));
    clinic.send('resume');
    if (code) clinic.send('risk', { code });
  }

  function returnFromViewer() {
    if (activePanel !== 'viewer') return;
    if (viewer.classList.contains('viewer-focus')) viewer.querySelector('[data-tool=focus]').click();
    if (document.fullscreenElement === viewer) document.exitFullscreen().catch(() => {});
    clinic.send('pause');
    show('result', action('open'));
  }

  picker.addEventListener('change', () => {
    addFiles(picker.files);
    picker.value = '';
  });
  drop.addEventListener('dragover', event => {
    event.preventDefault();
    drop.classList.add('studio-dragging');
    event.dataTransfer.dropEffect = 'copy';
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('studio-dragging'));
  drop.addEventListener('drop', event => {
    event.preventDefault();
    drop.classList.remove('studio-dragging');
    addFiles(event.dataTransfer.files);
  });
  studio.addEventListener('click', event => {
    const control = event.target.closest('[data-studio-action]');
    switch (control?.dataset.studioAction) {
      case 'remove':
        files = files.filter((_, index) => index !== Number(control.dataset.index));
        void validateSelection();
        picker.focus();
        break;
      case 'clear':
        files = [];
        void validateSelection();
        picker.focus();
        break;
      case 'demo':
      case 'import':
        void start(control.dataset.studioAction);
        break;
      case 'retry':
      case 'repeat':
        void start(currentMode);
        break;
      case 'cancel':
        if (clinicReady) run.abort();
        else releaseClinic();
        show('selection', action(currentMode));
        break;
      case 'selection':
        show('selection', action(currentMode));
        break;
      case 'open':
      case 'risk':
        location.hash = exploreLink('studio',control.dataset.code);
        break;

    }
  });
  return {open:openViewer,back:returnFromViewer,get prepared(){return clinicReady;},dispose() {
    bar.dispose();
    validation++;
    releaseClinic();
  }};
}
