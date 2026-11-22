import { loadClinic } from './studio/clinic-session.js';

const codes = ['R01', 'R02', 'R03', 'R04', 'R05'];
const statuses = ['Não avaliado', 'Em análise', 'Avaliado', 'Requer revisão'];
const blank = { status: statuses[0], notes: '', advice: '', date: '' };
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const dateText = date => date ? new Date(date).toLocaleString('pt-BR') : 'Sem registro';
const scopeText = 'Rascunho salvo neste dispositivo';
const image = code => `<img class="case-photo" src="./media/${code.toLowerCase()}.webp" alt="Vista documentada do caso ${code}">`;
const back = '<a href="#inspecoes">Voltar às inspeções</a>';

function readDraft(key) {
  const value = localStorage.getItem(key);
  if (value === null) return blank;
  const data = JSON.parse(value);
  if (!data || !statuses.includes(data.status) || !['notes','advice'].every(k => typeof data[k] === 'string' && data[k].length <= 4000)
    || typeof data.date !== 'string' || !Number.isFinite(Date.parse(data.date))) throw Error('Registro inválido');
  return data;
}

function documented(card) {
  return `<small>${escape(card.local)}</small><h3>Problema documentado</h3><p>${escape(card.problema_identificado)}</p>
    <h3>Proposta documentada</h3><p>${escape(card.sugestao_correcao)}</p>`;
}

function report(cards, drafts, completed) {
  return `<div class="actions report-tools"><a href="#inspecoes">Editar inspeção</a><button id="print-report">Imprimir / salvar como PDF</button></div>
    <article class="inspection-report"><header class="report-cover"><small>SAFEVISION Platform · V1</small>
    <h1>Relatório de inspeção</h1><h2>Clínica ÁUREA · V03</h2><p>Registro demonstrativo das avaliações humanas sobre cinco situações documentadas antes da construção.</p>
    <img src="./media/aurea.webp" alt="Modelo da Clínica ÁUREA"><p>Gerado em ${dateText(new Date())} · ${completed} de 5 casos avaliados</p>
    <ul>${cards.map(c => `<li>${c.codigo} · ${escape(c.nome_risco)} — ${escape(drafts[c.codigo].status)}</li>`).join('')}</ul></header>
    ${cards.map(c => {const d = drafts[c.codigo]; return `<section class="report-sheet"><small>Clínica ÁUREA · V03</small><h2>${c.codigo} · ${escape(c.nome_risco)}</h2>${image(c.codigo)}${documented(c)}
    <h3>Avaliação registrada</h3><p>${escape(d.status)} · ${dateText(d.date)}</p><h4>Observações</h4><p class="record-text">${escape(d.notes || 'Sem observações registradas.')}</p><h4>Recomendação complementar</h4><p class="record-text">${escape(d.advice || 'Sem recomendação registrada.')}</p>
    </section>`;}).join('')}
    <footer><h3>Considerações finais</h3><p>Os status descrevem o andamento da inspeção. As propostas são conceituais e o documento demonstrativo requer revisão profissional para uso técnico.</p></footer></article>`;
}

export function mountInspection(screen, route, userId) {
  const life = new AbortController();
  const key = code => `safevision:inspection:v1:${userId || 'guest'}:aurea-v03:${code}`;
  const code = route.split('/')[1];
  let session;
  let cards;
  const root = document.createElement('div');
  screen.replaceChildren(root);
  function stopViewer() { session?.dispose(); session = undefined; }
  function clearButton(c) { return `<button class="secondary" data-clear="${c}">Limpar registro ${c}</button>`; }
  function draw() {
    stopViewer();
    const drafts = {};
    const invalid = [];
    for (const id of codes) {
      try { drafts[id] = readDraft(key(id)); } catch { invalid.push(id); }
    }
    if (invalid.length) {
      root.innerHTML = `<h1>Rascunho indisponível</h1><p role="alert">Confira as permissões de armazenamento do navegador ou limpe o registro afetado.</p>${invalid.map(clearButton).join(' ')}`;
      return;
    }
    const completed = codes.filter(id => drafts[id].status === 'Avaliado').length;
    if (route === 'relatorios') {
      root.innerHTML = report(cards, drafts, completed);
      root.querySelector('#print-report').onclick = () => window.print();
      return;
    }
    const card = cards.find(c => c.codigo === code);
    if (!card) {
      root.innerHTML = `<div class="intro"><h1>Inspeções</h1><p>Clínica ÁUREA · Modelo V03</p></div>
        <section class="panel"><h2>Resumo da inspeção</h2><p><strong>${completed} de 5 avaliados</strong> · ${5-completed} por concluir</p>
        <progress value="${completed}" max="5" aria-label="Casos avaliados"></progress><p>${scopeText} · ${userId ? 'perfil atual' : 'visitante deste navegador'}</p>
        <div class="actions"><a class="button" href="#relatorios">Visualizar relatório</a><a href="./clinica/">Abrir modelo 3D</a></div></section>
        <div class="case-grid">${cards.map(c => `<a class="case" href="#inspecoes/${c.codigo}">${image(c.codigo)}<div><small>${c.codigo} · ${escape(drafts[c.codigo].status)}</small><h3>${escape(c.nome_risco)}</h3><p>${escape(c.local)}</p></div></a>`).join('')}</div>`;
      return;
    }
    const d = drafts[code];
    root.innerHTML = `${back}<h1>${code} · ${escape(card.nome_risco)}</h1><div class="inspection-grid"><section class="panel">${image(code)}${documented(card)}
      <button id="locate">Visualizar ${code} em 3D</button></section>
      <form class="panel" id="evaluation"><h2>Avaliação do usuário</h2><p>${scopeText}</p>
      <label>Status da avaliação<select name="status">${statuses.map(s => `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label for="inspection-notes">Observações</label><textarea id="inspection-notes" name="notes" maxlength="4000">${escape(d.notes)}</textarea>
      <label for="inspection-advice">Recomendação complementar</label><textarea id="inspection-advice" name="advice" maxlength="4000">${escape(d.advice)}</textarea>
      <p id="record-date">${dateText(d.date)}</p><div class="actions"><button>Salvar rascunho</button><a href="#relatorios">Ver relatório</a></div>
      <p role="status" id="save-message"></p></form></div><div class="inspection-view" hidden><button id="close-view">Voltar à ficha</button><p role="status"></p><div></div></div>
      ${d.date ? clearButton(code) : ''}`;
    const form = root.querySelector('form');
    form.onsubmit = event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.date = new Date().toISOString();
      try {
        localStorage.setItem(key(code), JSON.stringify(data));
        root.querySelector('#record-date').textContent = dateText(data.date);
        root.querySelector('#save-message').textContent = scopeText;
        if (!root.querySelector('[data-clear]')) root.insertAdjacentHTML('beforeend', clearButton(code));
      } catch { root.querySelector('#save-message').textContent = 'Falha ao salvar. Confira o armazenamento do navegador.'; }
    };
    const viewer = root.querySelector('.inspection-view');
    const locate = root.querySelector('#locate');
    const close = () => {
      stopViewer(); viewer.hidden = true; root.querySelector('.inspection-grid').hidden = false; locate.focus();
    };
    root.querySelector('#close-view').onclick = close;
    locate.onclick = () => {
      root.querySelector('.inspection-grid').hidden = true;
      viewer.hidden = false;
      viewer.querySelector('button').focus();
      const message = viewer.querySelector('p');
      message.textContent = 'Carregando a clínica…';
      session = loadClinic(viewer.querySelector('div'), {
        progress(percent) { session.keepWaiting(); message.textContent = `Modelo verificado · ${percent}%`; },
        ready() { message.textContent = `Inspeção em 3D · ${code}`; session.send('resume'); session.send('risk',{code}); },
        failure(text) { stopViewer(); message.textContent = text; },
        home: close,
      });
    };
  }
  root.onclick = event => {
    const id = event.target.closest('[data-clear]')?.dataset.clear;
    if (!codes.includes(id) || !confirm(`Limpar o registro local de ${id}?`)) return;
    try { localStorage.removeItem(key(id)); draw(); } catch { alert('O navegador bloqueou o armazenamento.'); }
  };
  root.innerHTML = '<p role="status">Carregando fichas oficiais…</p>';
  Promise.all(codes.map(async id => {
    const response = await fetch(`./clinica/WEB/data/fichas/${id}.json`, {signal:life.signal});
    if (!response.ok) throw Error('Ficha indisponível');
    const c = await response.json();
    if (c.codigo !== id || !['nome_risco','local','problema_identificado','sugestao_correcao'].every(k => typeof c[k] === 'string')) throw Error('Ficha inválida');
    return c;
  })).then(result => { if (!life.signal.aborted) { cards = result; draw(); } }).catch(() => {
    if (!life.signal.aborted) root.innerHTML = '<p role="alert">Falha ao carregar as fichas oficiais. Recarregue a página para tentar novamente.</p>';
  });
  return () => { life.abort(); stopViewer(); };
}
