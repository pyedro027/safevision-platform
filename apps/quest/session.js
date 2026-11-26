import { prepareXR } from './xr.js';

const storageKey = 'safevision:quest:diagnostico:v1';
const active = phase => ['ENTERING_XR', 'ACTIVE_XR', 'EXITING_XR'].includes(phase);
const previousAttemptKey = 'safevision:quest:ultima-tentativa:v1';
const maxSilence = 9000;

export function shouldRender(app, hidden, elapsed, interval) {
  if (active(app?.quest?.phase)) return true;
  return !app?.suspended && !hidden && elapsed >= interval - .5;
}

export function renderQuestFrame(app, scene) {
  if (!active(app?.quest?.phase)) {
    scene.render();
    return;
  }
  try { scene.render(); }
  catch (error) { app.quest.fail('scene-render', error); }
}

export function installQuestEntry(app, quality) {
  const {scene, engine, nav, ui, model} = app;
  const button = document.getElementById('enterVR');
  const status = document.getElementById('questStatus');
  const diagnostic = document.getElementById('questDiagnostic');
  const copy = document.getElementById('questCopy');
  const output = document.getElementById('questOutput');
  const B = window.BABYLON;
  const tasks = new AbortController();
  let previous;
  try {
    const value = localStorage.getItem(previousAttemptKey);
    previous = value ? JSON.parse(value) : undefined;
    if (!Array.isArray(previous?.events)) previous = undefined;
  } catch {}
  const policy = document.permissionsPolicy ?? document.featurePolicy;
  const report = {version:'V1.0.0-DEMO · Quest 2',commit:document.documentElement.dataset.release,babylon:B.Engine.Version,
    scene:'Clínica ÁUREA V03', secure:isSecureContext, webxr:!!navigator.xr,
    policy:policy?.allowsFeature('xr-spatial-tracking') ?? null, events:[]};
  let phase = 'LOADING', instance, busy = false, ending = false, disposed = false;
  let failure, wasBackground, observedSession, lastRender = 0, lastSample = 0, submitted = 0;
  const watchers = [];
  let watchdog, sessionEvents, contextLost = false, attempted = false;
  function watch(observable, callback) {
    watchers.push([observable, observable.add(callback)]);
  }
  function disposeInstance() {
    for (const [observable, observer] of watchers.splice(0)) observable.remove(observer);
    instance?.dispose();
    instance = undefined;
  }
  function persist() {
    try {
      const data = JSON.stringify(report);
      localStorage.setItem(storageKey, data);
      if (attempted) localStorage.setItem(previousAttemptKey, data);
    } catch {}
  }
  function record(event, data = {}) {
    report.events.push({ms:Math.round(performance.now()), event, ...data});
    if (report.events.length > 96) report.events.shift();
    persist();
  }
  function setPhase(next) {
    if (phase !== next) {
      phase = next;
      record('phase', {phase});
    }
  }
  function show(text) { status.textContent = text; }
  function finish() {
    if (disposed) return;
    clearInterval(watchdog);
    sessionEvents?.abort();
    observedSession = undefined;
    app.xrActive = false;
    app.xrPreparing = false;
    app.suspended = false;
    engine.renderEvenInBackground = wasBackground;
    scene.activeCamera = nav.camera;
    nav.sync();
    if (contextLost) return;
    ui.explore(false);
    const problem = failure;
    setPhase(problem ? 'ERROR' : 'READY_2D');
    button.disabled = false;
    button.textContent = problem ? 'Tentar entrar em VR' : 'Entrar em VR';
    show(problem ? 'A sessão foi interrompida. A clínica voltou ao modo de tela. Abra Diagnóstico para copiar o registro.' :
      'Sessão encerrada. Você pode entrar em VR novamente.');
  }
  function errorType(error) {
    const type = error?.name;
    return /^[A-Za-z][A-Za-z0-9]{0,36}$/.test(type || '') ? type : 'Error';
  }
  function fail(reason, error) {
    if (disposed || ending || failure) return;
    failure = reason;
    record('failure', {reason,error:errorType(error),frames:submitted});
    if (!busy && !active(phase)) return;
    ending = true;
    setPhase('EXITING_XR');
    show('Encerrando a sessão. Se a imagem estiver preta, use o botão Meta para voltar ao navegador.');
    const session = observedSession;
    // Babylon owns the session and restores its scheduler on the end event.
    if (session) {
      void session.end().catch(endError=>{
        if (observedSession !== session) return;
        record('exit-rejected', {error:errorType(endError)});
        show('O navegador ainda mantém a sessão. Saia pelo botão Meta e copie o diagnóstico.');
      }).finally(()=>{ending=false;});
    } else {
      ending = false;
      // A request awaiting browser permission cannot be cancelled from the page.
      if (!busy) finish();
    }
  }
  app.quest = { get phase(){return phase;}, record, show, fail,
    recoverGlobalFailure() {
      if (!active(phase)) return false;
      fail('global-render-failure');
      return true;
    } };
  wasBackground = engine.renderEvenInBackground;
  record('viewer-ready',{camera:nav.camera.name, rooms:model.config.rooms.length,
    meshes:scene.meshes.length, vertices:scene.getTotalVertices(), materials:scene.materials.length,
    textures:scene.textures.length, lights:scene.lights.length, webgl:engine.webGLVersion,
    maxTextureSize:engine.getCaps().maxTextureSize});
  const screenMode = document.getElementById('screenMode');
  screenMode.checked = true;
  screenMode.onchange();
  const desktopQuality = document.querySelector('.presentation-entry [data-quality=desktop]');
  desktopQuality.value = 'low';
  desktopQuality.onchange();
  document.querySelectorAll('[data-quality=xr]').forEach(select=>{ select.value = 'low'; });
  app.xrProfile = 'low';

  function diagnostics() {
    // Keep the previous page's diagnostic after a restart, unless this page has made a new attempt.
    const data = {atual:report, ...(previous && {anterior:previous})};
    output.value = JSON.stringify(data, null, 2);
  }
  diagnostic.addEventListener('toggle',diagnostics,{signal:tasks.signal});
  copy.onclick = async () => {
    diagnostics();
    try { await navigator.clipboard.writeText(output.value); copy.textContent='Diagnóstico copiado'; }
    catch { output.focus(); output.select(); copy.textContent='Selecione e copie o texto'; }
  };
  document.addEventListener('visibilitychange',()=>record('document-visibility',
    {hidden:document.hidden, suspended:!!app.suspended}),{signal:tasks.signal});
  nav.canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    contextLost = true;
    record('webgl-context-lost');
    fail('webgl-context-lost');
    show('O WebGL foi interrompido. Saia pelo botão Meta se necessário e copie o diagnóstico.');
  },{signal:tasks.signal});
  nav.canvas.addEventListener('webglcontextrestored',()=>{
    contextLost = false;
    record('webgl-context-restored');
    if (!observedSession) finish();
  },{signal:tasks.signal});
  addEventListener('error',event=>{
    record('browser-error',{error:errorType(event.error)});
    if (active(phase)) fail('browser-error',event.error);
  },{signal:tasks.signal});
  addEventListener('unhandledrejection',event=>{
    record('browser-rejection',{error:errorType(event.reason)});
    if (active(phase)) fail('browser-rejection',event.reason);
  },{signal:tasks.signal});

  async function prepare() {
    if (busy || disposed) return;
    busy = true;
    button.disabled = true;
    show('Verificando suporte à realidade virtual…');
    try {
      const supported = !!(isSecureContext && await navigator.xr?.isSessionSupported('immersive-vr'));
      record('immersive-vr-supported',{supported});
      if (!supported || disposed) {
        button.hidden = true;
        setPhase('READY_2D');
        show('Modo de tela disponível. VR imersiva não está disponível neste navegador.');
        return;
      }
      instance = await prepareXR(app, quality, app.xrProfile);
      if (disposed) { disposeInstance(); return; }
      if (!instance) throw new Error('WebXR unavailable');
      const helper = instance.xr.baseExperience;
      helper.camera.minZ = nav.camera.minZ;
      helper.camera.maxZ = nav.camera.maxZ;
      const manager = helper.sessionManager;
      watch(helper.onInitialXRPoseSetObservable,camera=>record('initial-xr-pose',{
        xyz:camera.position.asArray().map(n=>Math.round(n*100)/100),
        near:camera.minZ,far:camera.maxZ}));
      watch(helper.onStateChangedObservable,state=>{
        record('babylon-state',{state:B.WebXRState[state] ?? state});
        if (state === B.WebXRState.EXITING_XR) setPhase('EXITING_XR');
      });
      let firstCallback = false;
      watch(manager.onXRFrameObservable,()=>{
        if (firstCallback) return;
        firstCallback = true;
        record('first-xr-callback',{referenceSpace:manager.referenceSpace?.constructor?.name});
      });
      watch(manager.onXRSessionInit,session=>{
        observedSession = session;
        firstCallback = false;
        lastRender = performance.now();
        record('xr-session-init', {visibility:session.visibilityState,referenceSpaceRequested:'local-floor',profile:instance.profile});
        sessionEvents = new AbortController();
        session.addEventListener('visibilitychange',()=>{
          lastRender = performance.now();
          record('xr-visibility',{visibility:session.visibilityState});
        },{signal:sessionEvents.signal});
        if (failure) {
          // A request which returned after a context failure must not leave an orphan session.
          void session.end().catch(e=>record('exit-rejected',{error:errorType(e)}));
          return;
        }
        clearInterval(watchdog);
        watchdog = setInterval(()=>{
          if (observedSession === session && !ending && session.visibilityState !== 'hidden' &&
              performance.now() - lastRender > maxSilence) fail(submitted ? 'frames-stalled' : 'no-scene-frame');
        },500);
      });
      watch(manager.onXRSessionEnded,()=>{
        record('xr-session-ended',{frames:submitted});
        finish();
      });
      watch(scene.onAfterRenderObservable,()=>{
        if (!manager.inXRFrameLoop || !observedSession || scene.activeCamera !== helper.camera) return;
        lastRender = performance.now();
        if (submitted++ === 0) {
          const camera = helper.camera;
          const valid = camera.position.asArray().every(Number.isFinite) &&
            camera.globalPosition.asArray().every(Number.isFinite) &&
            camera.rigCameras.every(eye => eye.globalPosition.asArray().every(Number.isFinite));
          if (!valid) { fail('invalid-xr-camera'); return; }
          const layer = observedSession.renderState?.baseLayer;
          let viewports = [];
          const pose = manager.currentFrame?.getViewerPose(manager.referenceSpace);
          if (pose && layer) viewports = pose.views.map(view=>{
            const vp = layer.getViewport(view);
            return {eye:view.eye,width:vp?.width,height:vp?.height};
          });
          record('first-scene-frame',{eyes:camera.rigCameras.length,
            tracked:!!pose, referenceSpace:manager.referenceSpace?.constructor?.name,
            layerPresent:!!layer || !!observedSession.renderState?.layers?.length,
            width:layer?.framebufferWidth, height:layer?.framebufferHeight, viewports,
            activeMeshes:scene.getActiveMeshes().length});
          setPhase('ACTIVE_XR');
          show('Clínica em VR. O analógico esquerdo move e o direito gira. Use o grip para abrir o painel.');
        } else if (lastRender-lastSample > 6500) {
          lastSample = lastRender;
          record('frames',{count:submitted,activeMeshes:scene.getActiveMeshes().length});
        }
      });
      setPhase('READY_2D');
      button.textContent = 'Entrar em VR';
      button.disabled = false;
      show('Modelo pronto. Entre em VR ou use os botões na tela para explorar.');
    } catch (error) {
      record('prepare-failed',{error:errorType(error)});
      setPhase('ERROR');
      button.textContent = 'Verificar VR novamente';
      button.disabled = false;
      show('A preparação imersiva falhou. O modo de tela está disponível.');
    } finally { busy = false; }
  }

  app.invalidateXR = () => {
    if (busy || disposed || active(phase)) return;
    disposeInstance();
    void prepare();
  };
  button.onclick = () => {
    if (busy || disposed || active(phase)) return;
    if (!instance || instance.profile !== app.xrProfile) {
      disposeInstance();
      void prepare();
      return;
    }
    failure = undefined;
    attempted = true;
    submitted = 0;
    lastSample = performance.now();
    busy = true;
    app.xrPreparing = true;
    app.suspended = false;
    wasBackground = engine.renderEvenInBackground;
    engine.renderEvenInBackground = true;
    button.disabled = true;
    app.presentation.stop();
    if (ui.mode !== 'explore') ui.home();
    setPhase('ENTERING_XR');
    show('Entrando em VR…');
    // Invoke from the click. No permission probe or unrelated await before entry.
    instance.enter().catch(error=>{
      record('entry-rejected',{error:errorType(error)});
      failure = 'entry-rejected';
      if (!observedSession && phase !== 'ERROR') finish();
    }).finally(()=>{busy = false;app.xrPreparing = false;});
  };
  addEventListener('pagehide',event=>{
    record('pagehide',{cached:event.persisted,phase});
    if (event.persisted) {
      if (observedSession) void observedSession.end().catch(e=>record('exit-rejected',{error:errorType(e)}));
      return;
    }
    disposed = true;
    setPhase('DISPOSED');
    clearInterval(watchdog);
    const session = observedSession;
    sessionEvents?.abort();
    tasks.abort();
    if (session) void session.end().catch(()=>{}).finally(disposeInstance);
    else disposeInstance();
    window.safevisionStop();
  },{signal:tasks.signal});
  void prepare();
}
