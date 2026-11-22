import { codes, draftStore, remoteStore, reconcile } from './inspection-store.js';

export function mountSync({ userId, client, config, store, life, draw }) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  if (!userId) return panel;
  const heading = document.createElement('h2');
  heading.textContent = 'Rascunhos e sincronização';
  panel.append(heading);
  const status = document.createElement('p');
  status.setAttribute('role','status');
  panel.append(status);
  const remote = config && remoteStore(client, config, userId, life.signal);
  status.textContent = remote
    ? 'Use a sincronização para conferir os registros salvos. Uma cópia local fica disponível neste navegador.'
    : 'Sincronização indisponível nesta execução. Os registros ficam neste navegador.';
  function button(label, handler) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.onclick = handler;
    return element;
  }
  const controls = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = 'Operações';
  controls.append(legend);
  panel.append(controls);
  async function run(operation) {
    controls.disabled = true;
    try { await operation(); }
    catch (error) { if (!life.signal.aborted) status.textContent = error.message; }
    finally { controls.disabled = false; }
  }
  const comparison = document.createElement('div');
  comparison.className = 'inspection-grid';
  controls.append(comparison);
  function showConflict(code, record, current) {
    comparison.replaceChildren();
    status.textContent = `Conflito em ${code}. Compare as versões antes de escolher.`;
    for (const [label,row,choice] of [['Manter minha versão local',record,'local'],['Manter versão da nuvem',current,'cloud']]) {
      const section = document.createElement('section');
      section.className = 'panel record-text';
      const text = document.createElement('p');
      text.textContent = row ? [row.status,row.date,row.notes,row.advice].join('\n') : 'Sem registro na nuvem';
      section.append(text,button(label, () => run(async () => {
        await syncOne(code, choice, current, record);
        if (!comparison.childElementCount && !life.signal.aborted) refresh();
      })));
      comparison.append(section);
    }
    comparison.querySelector('button').focus();
  }
  async function syncOne(code, choice, observed, expected) {
    const record = store.read(code);
    if (expected && JSON.stringify(expected) !== JSON.stringify(record)) throw Error('O rascunho mudou. Compare as versões novamente.');
    if (choice) store.archive(code, choice === 'cloud' ? record : observed);
    const result = await reconcile(remote, code, record, choice, observed);
    life.signal.throwIfAborted();
    if (JSON.stringify(record) !== JSON.stringify(store.read(code))) throw Error('O rascunho mudou durante a operação. Sincronize novamente.');
    if (result.conflict) { showConflict(code, record, result.current); return false; }
    if (result.saved) store.write(code, result.saved);
    else if (record.date) store.clear(code);
    comparison.replaceChildren();
    return true;
  }
  function refresh() {
    const host = panel.parentElement;
    draw();
    host?.querySelector('button')?.focus();
  }
  if (remote) controls.prepend(button('Sincronizar avaliações', () => run(async () => {
    if (!navigator.onLine) throw Error('Sem conexão. Os rascunhos pendentes continuam neste navegador.');
    status.textContent = 'Consultando e salvando avaliações…';
    comparison.replaceChildren();
    for (const code of codes) if (!await syncOne(code)) return;
    refresh();
  })));

  const guest = draftStore();
  const available = codes.flatMap(code => {
    try { const row = guest.read(code); return row.date ? [[code,row]] : []; } catch { return []; }
  });
  if (available.length) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = `Importar rascunhos de visitante · ${available.length}`;
    details.append(summary);
    const inputs = [];
    for (const [code,row] of available) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      label.append(input, document.createTextNode(` ${code} · ${new Date(row.date).toLocaleString('pt-BR')}`));
      details.append(label);
      inputs.push([code,row,input]);
    }
    if (remote) details.append(button('Consultar versões na nuvem', () => run(async () => {
      const results = [];
      for (const [code] of available) {
        const row = await remote.get(code);
        results.push(code + (row ? ' tem versão na nuvem' : ' sem versão na nuvem'));
      }
      life.signal.throwIfAborted();
      status.textContent = results.join(' · ');
    })));
    details.append(button('Importar selecionados', () => run(() => {
      const selected = inputs.filter(([, ,input]) => input.checked);
      if (!selected.length) throw Error('Selecione pelo menos um rascunho.');
      if (selected.some(([code]) => store.read(code).date)) throw Error('Já existe uma avaliação local para um dos casos selecionados. O rascunho de visitante foi preservado.');
      for (const [code,row] of selected) store.write(code, { status: row.status, notes: row.notes, advice: row.advice, date: row.date, pending: true });
      refresh();
    })), button('Cancelar importação', () => { for (const [, ,input] of inputs) input.checked = false; details.open = false; summary.focus(); }));
    controls.append(details);
  }
  return panel;
}
