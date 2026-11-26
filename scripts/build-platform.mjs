import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildQuest } from './build-quest.mjs';

const root = new URL('../', import.meta.url);
const path = (name) => new URL(name, root);
const source = path('apps/platform/');
const output = path('dist/');
const questOnly = process.env.SAFEVISION_QUEST_ONLY === '1';
const url = questOnly ? undefined : process.env.SUPABASE_URL;
const key = questOnly ? undefined : process.env.SUPABASE_PUBLISHABLE_KEY;

if (Boolean(url) !== Boolean(key)) {
  throw new Error('Informe SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em conjunto.');
}
if (url) {
  const target = new URL(url);
  const loopback = ['localhost', '127.0.0.1'].includes(target.hostname);
  if ((target.protocol !== 'https:' && !(loopback && target.protocol === 'http:'))
    || target.username || target.password || target.search || target.hash || target.pathname !== '/'
    || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('Use a URL do projeto e uma chave pública publishable do Supabase.');
  }
}

const syncInspections = !questOnly && process.env.SAFEVISION_INSPECTION_SYNC === '1';
if (syncInspections && (!url || !['localhost','127.0.0.1'].includes(new URL(url).hostname))) {
  throw new Error('A sincronização da Missão 14 requer um Supabase isolado em loopback.');
}

if (!questOnly) {
  const vendor = JSON.parse(await readFile(path('apps/platform/vendor/provenance.json'), 'utf8'));
  const sdk = await readFile(path('apps/platform/vendor/supabase.js'));
  if (createHash('sha256').update(sdk).digest('hex') !== vendor.sha256) {
    throw new Error('A biblioteca local do Supabase diverge da versão verificada.');
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
if (!questOnly) await cp(source, output, { recursive: true });
else await cp(path('apps/platform/viewer-interior.css'),path('dist/viewer-interior.css'));
await cp(path('apps/viewer/'), path('dist/clinica/'), { recursive: true });
const inventory = JSON.parse(await readFile(path('docs/inventario-versao-c.json'), 'utf8'));
for (const entry of inventory.files) {
  const distributed = await readFile(path('dist/clinica/' + entry.path));
  if (distributed.length !== entry.bytes || createHash('sha256').update(distributed).digest('hex') !== entry.sha256) {
    throw new Error('A cópia distribuída diverge do inventário: ' + entry.path);
  }
}
await buildQuest(root, output, questOnly);
if (questOnly) {
  await writeFile(path('dist/index.html'), '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./vr/"><title>SAFEVISION · Quest</title><a href="./vr/">Abrir Clínica ÁUREA</a>');
  console.log('Distribuição isolada Quest em dist/');
  process.exit(0);
}
// Derive only the entry document. All scripts, data and scene assets are served from the verified original.
const originalEntry = await readFile(path('apps/viewer/WEB/index.html'), 'utf8');
for (const id of ['tour','entry','hud','loadMessage','riskContent','startButton']) {
  if (!originalEntry.includes(`id="${id}"`)) throw Error('Entrada do tour incompatível: '+id);
}
const integratedEntry = originalEntry.replace('<head>', '<head><base href="./clinica/WEB/">')
  .replace('</head>', '<link rel="stylesheet" href="../../viewer-interior.css"></head>')
  .replace('<div id="riskContent"></div>', '<div id="riskContent"></div><a id="review-case" target="_parent" hidden>Avaliar este caso</a>')
  .replace('</body>', '<script type="module" src="../../viewer-controls.js"></script></body>')
  .replace('<body>', '<body data-edition="integrated">')
  .replace('SAFEVISION 3D <span>PROJETO INTEGRADOR · DEMONSTRAÇÃO V03</span>', 'SAFEVISION Platform')
  .replace('Entre na<br>Clínica <em>ÁUREA.</em>', 'Clínica ÁUREA')
  .replace('SAFEVISION <b>3D</b>', 'SAFEVISION <b>Platform</b>');
await writeFile(path('dist/visualizador.html'), integratedEntry);
await writeFile(path('dist/config.json'), JSON.stringify(url ? { url, key, ...(syncInspections && { inspectionSync: true }) } : {}));
console.log('Distribuição gerada em dist/. Visualizador preservado em dist/clinica/.');
