import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

function replace(source, from, to) {
  if (!source.includes(from)) throw new Error('Origem da derivação Quest incompatível: ' + from.slice(0, 80));
  return source.replace(from, to);
}

async function original(path) {
  const text = await readFile(new URL('../apps/viewer/WEB/' + path, import.meta.url), 'utf8');
  return text.replaceAll('\r\n', '\n');
}

export async function buildQuest(root, output, questOnly) {
  const dir = new URL('vr/', output);
  await mkdir(dir, { recursive:true });
  await cp(new URL('apps/quest/', root), dir, { recursive:true });
  const release = process.env.VERCEL_GIT_COMMIT_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
  if (!/^[0-9a-f]{40}$/.test(release)) throw new Error('SHA da distribuição Quest inválido');
  const home = questOnly ? 'https://safevision-platform.vercel.app/#aurea' : '../../#aurea';
  let html = await original('index.html');
  html = replace(html, '<html lang="pt-BR"><head>', '<html lang="pt-BR" data-release="'+release+'"><head><base href="../clinica/WEB/">');
  html = replace(html, '</head>', '<link rel="stylesheet" href="../../viewer-interior.css"><link rel="stylesheet" href="../../vr/quest.css"></head>');
  html = replace(html, '<body>', '<body data-edition="integrated">');
  html = replace(html, 'src="tour.js"', 'src="../../vr/tour.js"');
  html = replace(html, 'Entre na<br>Clínica <em>ÁUREA.</em>', 'Clínica ÁUREA');
  html = replace(html, 'Percorra o projeto e explore os pontos de inspeção antes da construção.', 'No modo de tela, aponte para os botões e pressione o gatilho. Em VR, use os analógicos.');
  html = replace(html, '<script src="loading-guard.js">', `<section id="questPanel" aria-label="Realidade virtual">
    <div class="quest-links"><button id="enterVR" disabled>Preparando VR…</button><a href="${home}">Voltar à SAFEVISION</a></div>
    <p id="questStatus" role="status">Aguarde o carregamento da clínica.</p>
    <details id="questDiagnostic"><summary>Diagnóstico</summary>
      <button id="questCopy">Copiar diagnóstico</button>
      <textarea id="questOutput" readonly aria-label="Diagnóstico da sessão"></textarea>
    </details>
    </section><script src="../../vr/guard.js">`);
  await writeFile(new URL('index.html', dir), html);

  const guard = await original('loading-guard.js');
  await writeFile(new URL('guard.js', dir), replace(guard, 'function(message){',
    `function(message){
 if(window.__tourDebug?.quest?.recoverGlobalFailure())return;`));

  let tour = await original('tour.js');
  tour = replace(tour, "import {installBridge} from './modules/bridge.js';",
    "import {installQuestEntry, shouldRender, renderQuestFrame} from './session.js';");
  tour = tour.replaceAll("from './modules/", "from '../clinica/WEB/modules/");
  tour = replace(tour, ',doNotHandleContextLost:true', '');
  const oldContext = tour.split('\n').find(line=>line.startsWith("canvas.addEventListener('webglcontextlost'"));
  tour = replace(tour, oldContext + '\n', '');
  tour = replace(tour, 'installBridge(window.__tourDebug,quality);', 'installQuestEntry(window.__tourDebug,quality);');
  tour = replace(tour, "window.__tourDebug?.suspended||(!window.__tourDebug?.xrActive&&(document.hidden||elapsed<interval-.5))",
    "!shouldRender(window.__tourDebug,document.hidden,elapsed,interval)");
  tour = replace(tour, ' scene.render();', ' renderQuestFrame(window.__tourDebug,scene);');
  await writeFile(new URL('tour.js', dir), tour);

  let xr = await original('modules/xr.js');
  xr = xr.replaceAll("from './", "from '../clinica/WEB/modules/");
  xr = replace(xr, "const status=text=>parent.postMessage({channel:'safevision',event:'vr-status',text},location.origin);",
    "const status=app.quest.show;");
  // Restore the lower XR target used in the November archive, with a single-sample stereo buffer.
  xr = replace(xr, 'canvasOptions:{antialias:true,', 'canvasOptions:{antialias:false,');
  xr = replace(xr, 'const token=observable.add(fn);', "const token=observable.add(value=>{try{fn(value)}catch(error){app.quest.fail('xr-observer',error);}});");
  xr = replace(xr, 'turnReady=true,headTracked=false;', 'turnReady=true,headTracked=false,leftLogged=false,rightLogged=false;');
  xr = replace(xr, 'rays.set(controller.uniqueId,', "app.quest.record('controller-connected',{hand:controller.inputSource.handedness, profiles:[...controller.inputSource.profiles].slice(0,5), mapping:controller.inputSource.gamepad?.mapping});\n  rays.set(controller.uniqueId,");
  xr = replace(xr, 'pressed.delete(c.inputSource);rays.delete(c.uniqueId);draw(true);',
    "pressed.delete(c.inputSource);rays.delete(c.uniqueId);app.quest.record('controller-removed',{hand:c.inputSource.handedness});draw(true);");
  const oldMovement = xr.match(/  if\(!safe\|\|!leftOK\|\|!rightOK\)\{[\s\S]+?\n  \}\n  let changed=false;/)?.[0];
  if (!oldMovement) throw new Error('Bloco de locomoção original ausente');
  xr = replace(xr, oldMovement, `  if (!safe || !leftOK) motionArmed=false;
  else if (Math.hypot(l.x,l.y)<.01) motionArmed=true;
  if (!safe || !rightOK) turnReady=false;
  else if (Math.abs(r.x)<.2) turnReady=true;
  if (safe && !pressed.size) {
   const camera=xr.baseExperience.camera;
   if (motionArmed && (l.x || l.y)) {
    nav.moveXR(camera,l.x,l.y,boundedDt(app.engine.getDeltaTime()/1000));
    if (!leftLogged) { leftLogged=true;app.quest.record('left-stick',{x:l.x,y:l.y}); }
   }
   if (turnReady && Math.abs(r.x)>.65) {
    const sign=scene.useRightHandedSystem?-1:1;
    turn(Math.sign(r.x)*sign*Math.PI/6);
    turnReady=false;
    if (!rightLogged) { rightLogged=true;app.quest.record('right-stick',{x:r.x}); }
   }
  }
  let changed=false;`);
  xr = replace(xr, 'ensurePanel();panel.setEnabled(true);center();status(', 'leftLogged=false;rightLogged=false;ensurePanel();startWalk();status(');
  xr = replace(xr, 'Passear habilita analógicos; grip para.', 'Esquerdo move, direito gira. Grip abre o painel.');
  // Keep the native reference-space, inputs, panel, doors and all five case actions.
  await writeFile(new URL('xr.js', dir), xr);
}
