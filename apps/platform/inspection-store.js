export const codes = ['R01','R02','R03','R04','R05'];
export const statuses = ['Não avaliado','Em análise','Avaliado','Requer revisão'];
export const blank = { status: statuses[0], notes: '', advice: '', date: '' };
const model = 'aurea-v03';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const fields = ['status','notes','advice'];

export function draftStore(userId, storage = localStorage) {
  const legacy = code => `safevision:inspection:v1:${userId || 'guest'}:${model}:${code}`;
  const key = code => legacy(code).replace(':v1:', ':v2:');
  function read(code) {
    const current = storage.getItem(key(code));
    const raw = current ?? storage.getItem(legacy(code));
    if (raw === null) return blank;
    const row = JSON.parse(raw);
    if (current !== null && row === null) return blank;
    validate(row);
    return row;
  }
  function write(code, row) {
    validate(row);
    storage.setItem(key(code), JSON.stringify(row));
    return row;
  }
  function backups(code) {
    return JSON.parse(storage.getItem(key(code) + ':backup') || '[]');
  }
  return {
    read, write, backups,
    save(code, values) {
      const previous = read(code);
      return write(code, { ...previous, ...values, date: new Date().toISOString(), pending: true });
    },
    clear(code) { storage.setItem(key(code), 'null'); storage.removeItem(legacy(code)); },
    archive(code, row) {
      if (!row?.date) return;
      const history = backups(code);
      if (JSON.stringify(history.at(-1)) !== JSON.stringify(row)) {
        storage.setItem(key(code) + ':backup', JSON.stringify([...history, row]));
      }
    },
  };
}

function validate(row) {
  if (!row || !statuses.includes(row.status) || !['notes','advice'].every(k => typeof row[k] === 'string' && row[k].length <= 4000)
    || /\u0000/.test(row.notes + row.advice) || typeof row.date !== 'string' || !Number.isFinite(Date.parse(row.date))
    || (row.revision != null && !uuid.test(row.revision))) throw Error('Registro inválido.');
}

export function remoteStore(client, config, userId, signal) {
  async function request(code, method, data, revision) {
    signal.throwIfAborted();
    const { data: auth, error } = await client.auth.getSession();
    const session = auth?.session;
    if (error || session?.user.id !== userId || !(session.expires_at * 1000 > Date.now())) throw Error('Sessão indisponível. Entre novamente.');
    const url = new URL('/rest/v1/inspection_reviews', config.url);
    url.searchParams.set('model_version', 'eq.' + model);
    url.searchParams.set('case_code', 'eq.' + code);
    if (revision) url.searchParams.set('revision', 'eq.' + revision);
    const response = await fetch(url, { method, signal, body: data && JSON.stringify(data), headers: {
      apikey: config.key, Authorization: 'Bearer ' + session.access_token,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    }});
    if (response.status === 409 && method === 'POST') return null;
    if (!response.ok) throw Error(`A sincronização falhou (HTTP ${response.status}).`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length > 1 || (method === 'POST' && !rows.length)) throw Error('Resposta inesperada do servidor.');
    if (!rows.length) return null;
    const row = rows[0];
    if (row.owner_id !== userId || row.model_version !== model || row.case_code !== code || !uuid.test(row.revision)) throw Error('Resposta inesperada do servidor.');
    const result = { status: row.status, notes: row.notes, advice: row.advice, date: row.updated_at,
      createdAt: row.created_at, revision: row.revision, pending: false };
    validate(result);
    return result;
  }
  return {
    get: code => request(code, 'GET'),
    put(code, local, revision) {
      const values = Object.fromEntries(fields.map(k => [k, local[k]]));
      return revision ? request(code, 'PATCH', values, revision)
        : request(code, 'POST', { ...values, model_version: model, case_code: code });
    },
  };
}

export async function reconcile(remote, code, record, choice, observed) {
  const current = await remote.get(code);
  if (choice && (current?.revision ?? null) !== (observed?.revision ?? null)) return { conflict: true, current };
  const pending = record.date && record.pending !== false;
  if (!pending || choice === 'cloud') return { saved: current };
  const revision = choice === 'local' ? current?.revision : record.revision;
  if ((revision ?? null) !== (current?.revision ?? null)) return { conflict: true, current };
  if (current && fields.every(k => current[k] === record[k])) return { saved: current };
  const saved = await remote.put(code, record, revision);
  return saved ? { saved } : { conflict: true, current: await remote.get(code) };
}
