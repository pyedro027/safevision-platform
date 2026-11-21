import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const path = (name) => new URL(name, root);
const source = path('apps/platform/');
const output = path('dist/');
const { SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key } = process.env;

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

const vendor = JSON.parse(await readFile(path('apps/platform/vendor/provenance.json'), 'utf8'));
const sdk = await readFile(path('apps/platform/vendor/supabase.js'));
if (createHash('sha256').update(sdk).digest('hex') !== vendor.sha256) {
  throw new Error('A biblioteca local do Supabase diverge da versão verificada.');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await cp(path('apps/viewer/'), path('dist/clinica/'), { recursive: true });
await writeFile(path('dist/config.json'), JSON.stringify(url ? { url, key } : {}));
console.log('Distribuição gerada em dist/. Visualizador preservado em dist/clinica/.');
