export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc = escapeText;
const dates = new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'});
const names = new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('pt-BR');
export const dateLabel = value => Number.isFinite(Date.parse(value)) ? dates.format(new Date(value)) : 'Data indisponível';
export const demoCard = `<aside class="project-demo"><img src="./media/aurea.webp" alt="Fachada da clínica"><div><small>Demonstração disponível</small><h2>Clínica ÁUREA</h2><p>Explore a clínica de referência e os cinco casos documentados.</p><a href="#aurea">Conhecer o projeto →</a></div></aside>`;
export function projectResults(rows, filters) {
  const needle = normalize(filters.search.trim());
  const result = rows.filter(p => normalize(p.title+' '+p.description).includes(needle));
  result.sort((a,b) => {
    let diff = filters.sort.startsWith('name') ? names.compare(a.title,b.title) : Date.parse(b.updated_at)-Date.parse(a.updated_at);
    if (['name-desc','old'].includes(filters.sort)) diff *= -1;
    return diff || a.id.localeCompare(b.id);
  });
  return `<p class="result-count" role="status">${result.length} de ${rows.length} projetos</p>` +
    (result.length ? `<div class="portfolio ${filters.view}">${result.map(p=>`<article class="project-record">
      <span class="folder" aria-hidden="true"></span><div><h2><a href="#projetos/${esc(p.id)}">${esc(p.title)}</a></h2>
      <p>${esc(p.description || 'Sem descrição.')}</p></div><footer><span>Atualizado em</span> ${dateLabel(p.updated_at)}</footer>
      </article>`).join('')}</div>` : '<div class="blank"><h2>Nenhum resultado</h2><button class="secondary" data-action="clear-search">Limpar pesquisa</button></div>');
}
export function projectsPage(state,status,filters) {
  const ready = !status;
  return `<header class="heading-row intro"><div><h1>Meus projetos</h1><p class="muted">Organize os projetos da sua conta e consulte o histórico de cada um.</p></div>
    ${ready ? '<button data-action="new">Novo projeto</button>':''}</header>
    <section class="project-library" aria-label="Projetos privados">${status ? '<div class="blank">'+status+'</div>' :
      !state.projects.length ? '<div class="blank"><span class="folder" aria-hidden="true"></span><h2>Você ainda não tem projetos.</h2><p>Cadastre o primeiro projeto com um nome e uma descrição.</p></div>' :
      `<div class="library-tools"><label>Pesquisar projetos<input id="project-search" type="search" placeholder="Nome ou descrição" value="${esc(filters.search)}"></label>
       <label>Ordenar por<select id="project-sort">${[['recent','Atualizados recentemente'],['old','Atualizados há mais tempo'],['name','Nome A–Z'],['name-desc','Nome Z–A']].map(([v,l])=>`<option value="${v}" ${filters.sort===v?'selected':''}>${l}</option>`).join('')}</select></label>
       <div class="view-switch" role="group" aria-label="Visualização">${['grade','lista'].map(v=>`<button class="secondary" data-action="view" data-view="${v}" aria-pressed="${filters.view===v}">${v==='grade'?'Grade':'Lista'}</button>`).join('')}</div></div>
       <div id="project-results">${projectResults(state.projects,filters)}</div>`}</section>${demoCard}`;
}
export function projectDetail(p,status) {
  const back = '<a class="back" href="#projetos">← Meus projetos</a>';
  if (!p || status) return back+'<section class="panel"><h1>Projeto</h1>'+(status || 'Projeto indisponível para esta conta.')+'</section>';
  return back+`<header class="heading-row intro"><div><h1>${esc(p.title)}</h1><p class="muted">Projeto privado</p></div>
    <div class="actions"><button data-action="edit" data-id="${esc(p.id)}">Editar</button><button class="secondary" data-action="confirm-delete" data-id="${esc(p.id)}">Excluir</button></div></header>
    <div class="detail-grid"><section class="panel"><h2>Informações do projeto</h2><p class="description">${esc(p.description || 'Sem descrição.')}</p>
    <dl class="specs"><div><dt>Criado em</dt><dd>${dateLabel(p.created_at)}</dd></div><div><dt>Atualizado em</dt><dd>${dateLabel(p.updated_at)}</dd></div>
    <div><dt>Identificador</dt><dd><code>${esc(p.id)}</code></dd></div></dl></section>
    <section class="panel"><h2>Modelo 3D</h2><p>${p.model_object_key?'Referência de modelo registrada.':'Nenhum modelo associado.'}</p>
    <h3>Inspeções deste projeto</h3><p>A inspeção demonstrativa está disponível na Clínica ÁUREA.</p><a href="#aurea">Conhecer a demonstração →</a></section></div>
    <section class="panel"><h2>Histórico do projeto</h2><div id="project-history" role="status">Carregando histórico…</div></section>`;
}
export function versionList(rows) {
  return rows.length ? '<ol class="history">'+rows.map(v=>`<li><small>${dateLabel(v.recorded_at)}</small><strong>${esc(v.title)}</strong><p>${esc(v.description || 'Sem descrição.')}</p></li>`).join('')+'</ol>' : 'Sem versões registradas.';
}
